import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import {
  RuntimeModule,
  runtimeMethod,
  runtimeModule,
  state,
} from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { Bool, Field, Provable, PublicKey, Struct } from "o1js";
import { inject } from "tsyringe";
import { Balances } from "../balances";
import type { TokenRegistry } from "../token-registry";
import { LPTokenId } from "./lp-token-id";
import { PoolKey } from "./pool-key";
import { TokenPair } from "./token-pair";

export const errors = {
  tokensNotDistinct: () => `Tokens must be different`,
  poolAlreadyExists: () => `Pool already exists`,
  poolDoesNotExist: () => `Pool does not exist`,
  amountAIsZero: () => `Amount A must be greater than zero`,
  amountALimitInsufficient: () => `Amount A limit is insufficient`,
  amountBLimitInsufficient: () => `Amount B limit is insufficient`,
  reserveAIsZero: () => `Reserve A must be greater than zero`,
  lpTokenSupplyIsZero: () => `LP token supply is zero`,
  amountOutIsInsufficient: () => `Amount out is insufficient`,
  minimumLiquidityInsufficient: () => `Minimum liquidity is insufficient`,
};

// we need a placeholder pool value until protokit supports value-less dictonaries or state arrays
export const placeholderPoolValue = Field.from(1);

export const MAX_PATH_LENGTH = 3;
export class TokenIdPath extends Struct({
  path: Provable.Array(TokenId, MAX_PATH_LENGTH),
}) {}

export interface XYKConfig {
  feeDivider: bigint;
  fee: bigint;
  minimumLiquidity: Balance;
}

export class PoolWhitelist extends Struct({
  poolKey: PoolKey,
  user: PublicKey,
}) {}

/**
 * Runtime module responsible for providing trading/management functionalities for Dark Pools.
 *
 * @author kaupangdx https://github.com/kaupangdx/kaupangdx-new
 * @author marcuspang https://github.com/marcuspang/ethglobal-singapore
 */
@runtimeModule()
export class XYK extends RuntimeModule<XYKConfig> {
  // all existing pools in the system
  @state() public pools = StateMap.from<PoolKey, Field>(PoolKey, Field);
  /**
   * Mapping of pool keys to a boolean indicating if the pool is whitelisted.
   */
  @state() public poolWhitelist = StateMap.from<PoolWhitelist, Bool>(
    PoolWhitelist,
    Bool
  );

  /**
   * Provide access to the underlying Balances runtime to manipulate balances
   * for both pools and users
   */
  public constructor(
    @inject("Balances") public balances: Balances,
    @inject("TokenRegistry") public tokenRegistry: TokenRegistry
  ) {
    super();
  }

  public async poolExists(poolKey: PoolKey) {
    return (await this.pools.get(poolKey)).isSome;
  }

  /**
   * Creates a Dark Pool if one doesnt exist yet, and if the creator has
   * sufficient balance to do so.
   *
   * @param creator
   * @param tokenAId
   * @param tokenBId
   * @param tokenASupply
   * @param tokenBSupply
   */
  public async createPool(
    creator: PublicKey,
    tokenAId: TokenId,
    tokenBId: TokenId,
    tokenAAmount: Balance,
    tokenBAmount: Balance
  ) {
    const tokenPair = TokenPair.from(tokenAId, tokenBId);
    const poolKey = PoolKey.fromTokenPair(tokenPair);

    const areTokensDistinct = tokenAId.equals(tokenBId).not();
    assert(areTokensDistinct, errors.tokensNotDistinct());

    const poolDoesNotExist = (await this.poolExists(poolKey)).not();
    assert(poolDoesNotExist, errors.poolAlreadyExists());

    const initialLPTokenSupply = Balance.from(
      // if tokenA supply is greater than tokenB supply, use tokenA supply, otherwise use tokenB supply
      Provable.if(
        tokenAId.greaterThan(tokenBId),
        Balance,
        tokenAAmount,
        tokenBAmount
      ).value as any
    );

    const isMinimumLiquiditySufficient =
      initialLPTokenSupply.greaterThanOrEqual(this.config.minimumLiquidity);
    assert(isMinimumLiquiditySufficient, errors.minimumLiquidityInsufficient());

    // transfer liquidity from the creator to the pool
    await this.balances.transfer(tokenAId, creator, poolKey, tokenAAmount);
    await this.balances.transfer(tokenBId, creator, poolKey, tokenBAmount);

    // determine initial LP token supply
    const lpTokenId = LPTokenId.fromTokenPair(tokenPair);

    await this.tokenRegistry.addTokenId(lpTokenId);
    await this.balances.addBalance(lpTokenId, creator, initialLPTokenSupply);
    await this.pools.set(poolKey, placeholderPoolValue);
  }

  /**
   * Provides liquidity to an existing pool, if the pool exists and the
   * provider has sufficient balance. Additionally mints LP tokens for the provider.
   *
   * @param provider
   * @param tokenAId
   * @param tokenBId
   * @param amountA
   * @param amountBLimit
   */
  public async addLiquidity(
    provider: PublicKey,
    tokenAId: TokenId,
    tokenBId: TokenId,
    tokenAAmount: Balance,
    tokenBAmountLimit: Balance
  ) {
    const tokenPair = TokenPair.from(tokenAId, tokenBId);
    tokenAId = tokenPair.tokenAId;
    tokenBId = tokenPair.tokenBId;
    const poolKey = PoolKey.fromTokenPair(tokenPair);
    const poolDoesExists = await this.poolExists(poolKey);
    assert(poolDoesExists, errors.poolDoesNotExist());

    const amountANotZero = tokenAAmount.greaterThan(Balance.from(0));
    assert(amountANotZero, errors.amountAIsZero());

    const reserveA = await this.balances.getBalance(tokenAId, poolKey);
    const reserveANotZero = reserveA.greaterThan(Balance.from(0));
    assert(reserveANotZero, errors.reserveAIsZero());
    const reserveB = await this.balances.getBalance(tokenBId, poolKey);
    const adjustedReserveA = Balance.from(
      Provable.if(reserveANotZero, reserveA.value, Balance.from(1).value) as any
    );

    const amountB = tokenAAmount.mul(reserveB).div(adjustedReserveA);
    const isAmountBLimitSufficient =
      tokenBAmountLimit.greaterThanOrEqual(amountB);
    assert(isAmountBLimitSufficient, errors.amountBLimitInsufficient());

    const lpTokenId = LPTokenId.fromTokenPair(tokenPair);
    const lpTokenTotalSupply = (await this.balances.getTokenSupply(lpTokenId))
      .value;

    // TODO: ensure tokens are provided in the right order, not just ordered by the TokenPair
    // otherwise the inputs for the following math will be in the wrong order
    const lpTokensToMint = lpTokenTotalSupply
      .mul(tokenAAmount)
      .div(adjustedReserveA);

    await this.balances.transfer(tokenAId, provider, poolKey, tokenAAmount);
    await this.balances.transfer(tokenBId, provider, poolKey, amountB);
    await this.balances.addBalance(lpTokenId, provider, lpTokensToMint);
  }

  public async removeLiquidity(
    provider: PublicKey,
    tokenAId: TokenId,
    tokenBId: TokenId,
    lpTokenAmount: Balance,
    // TODO: change to min/max limits everywhere
    tokenAAmountLimit: Balance,
    tokenBLAmountLimit: Balance
  ) {
    const tokenPair = TokenPair.from(tokenAId, tokenBId);
    tokenAId = tokenPair.tokenAId;
    tokenBId = tokenPair.tokenBId;
    const poolKey = PoolKey.fromTokenPair(tokenPair);
    const poolDoesExists = await this.poolExists(poolKey);
    assert(poolDoesExists, errors.poolDoesNotExist());

    const lpTokenId = LPTokenId.fromTokenPair(tokenPair);
    const lpTokenTotalSupply = (await this.balances.getTokenSupply(lpTokenId))
      .value;

    const lpTokenTotalSupplyIsZero = lpTokenTotalSupply.equals(Balance.from(0));
    assert(lpTokenTotalSupplyIsZero.not(), errors.lpTokenSupplyIsZero());

    const adjustedLpTokenTotalSupply = Balance.from(
      Provable.if(
        lpTokenTotalSupplyIsZero,
        Balance.from(1).value,
        lpTokenTotalSupply.value
      ).value as any
    );
    const reserveA = await this.balances.getBalance(tokenAId, poolKey);
    const reserveB = await this.balances.getBalance(tokenBId, poolKey);

    const tokenAAmount = Balance.from(lpTokenAmount)
      .mul(reserveA)
      .div(adjustedLpTokenTotalSupply);
    const tokenBAmount = Balance.from(lpTokenAmount)
      .mul(reserveB)
      .div(adjustedLpTokenTotalSupply);

    const isTokenAAmountLimitSufficient =
      tokenAAmountLimit.greaterThanOrEqual(tokenAAmount);
    const isTokenBAmountLimitSufficient =
      tokenBLAmountLimit.greaterThanOrEqual(tokenBAmount);

    assert(isTokenAAmountLimitSufficient, errors.amountALimitInsufficient());
    assert(isTokenBAmountLimitSufficient, errors.amountBLimitInsufficient());

    await this.balances.transfer(tokenAId, poolKey, provider, tokenAAmount);
    await this.balances.transfer(tokenBId, poolKey, provider, tokenBAmount);
    await this.balances.removeBalance(lpTokenId, provider, lpTokenAmount);
  }

  public calculateTokenOutAmountFromReserves(
    reserveIn: Balance,
    reserveOut: Balance,
    amountIn: Balance
  ) {
    const numerator = amountIn.mul(reserveOut);
    const denominator = reserveIn.add(amountIn);

    // TODO: extract to safemath
    const adjustedDenominator = Balance.from(
      Provable.if(denominator.equals(0), Balance, Balance.from(1), denominator)
        .value as any
    );

    assert(denominator.equals(adjustedDenominator), "denominator is zero");

    return numerator.div(adjustedDenominator);
  }

  public async calculateTokenOutAmount(
    tokenIn: TokenId,
    tokenOut: TokenId,
    amountIn: Balance
  ) {
    const tokenPair = TokenPair.from(tokenIn, tokenOut);
    const pool = PoolKey.fromTokenPair(tokenPair);

    const reserveIn = await this.balances.getBalance(tokenIn, pool);
    const reserveOut = await this.balances.getBalance(tokenOut, pool);

    return this.calculateTokenOutAmountFromReserves(
      reserveIn,
      reserveOut,
      amountIn
    );
  }

  public async calculateAmountIn(
    tokenIn: TokenId,
    tokenOut: TokenId,
    amountOut: Balance
  ) {
    const tokenPair = TokenPair.from(tokenIn, tokenOut);
    const pool = PoolKey.fromTokenPair(tokenPair);

    const reserveIn = await this.balances.getBalance(tokenIn, pool);
    const reserveOut = await this.balances.getBalance(tokenOut, pool);

    return this.calculateAmountInFromReserves(reserveIn, reserveOut, amountOut);
  }

  public calculateAmountInFromReserves(
    reserveIn: Balance,
    reserveOut: Balance,
    amountOut: Balance
  ) {
    const numerator = reserveIn.mul(amountOut);
    const denominator = reserveOut.sub(amountOut);

    // TODO: extract to safemath
    const adjustedDenominator = Balance.from(
      Provable.if(denominator.equals(0), Balance, Balance.from(1), denominator)
        .value as any
    );

    assert(denominator.equals(adjustedDenominator), "denominator is zero");

    return numerator.div(adjustedDenominator);
  }

  public async sellPath(
    seller: PublicKey,
    { path }: TokenIdPath,
    amountIn: Balance,
    amountOutMinLimit: Balance
  ) {
    const initialTokenPair = TokenPair.from(path[0], path[1]);
    const initialPoolKey = PoolKey.fromTokenPair(initialTokenPair);
    const pathBeginswWithExistingPool = await this.poolExists(initialPoolKey);

    assert(pathBeginswWithExistingPool, errors.poolDoesNotExist());

    let amountOut = Balance.zero;
    let lastPoolKey = PoolKey.empty();
    let sender = seller;
    // TODO: better handling of dummy tokens
    let lastTokenOut = TokenId.from(this.tokenRegistry.config.maxTokens.value);

    // TODO: figure out if there are path variation edge cases
    // if yes, make the whole trade fail if the path is not valid
    for (let i = 0; i < MAX_PATH_LENGTH - 1; i++) {
      const tokenIn = path[i];
      const tokenOut = path[i + 1];

      const tokenPair = TokenPair.from(tokenIn, tokenOut);
      const poolKey = PoolKey.fromTokenPair(tokenPair);
      const poolExists = await this.poolExists(poolKey);

      const calculatedAmountOut = await this.calculateTokenOutAmount(
        tokenIn,
        tokenOut,
        Balance.from(amountIn)
      );

      const amoutOutWithoutFee = calculatedAmountOut.sub(
        calculatedAmountOut.mul(3n).div(100000n)
      );

      lastTokenOut = Provable.if(poolExists, TokenId, tokenOut, lastTokenOut);

      lastPoolKey = Provable.if(poolExists, PoolKey, poolKey, lastPoolKey);

      amountOut = Balance.from(
        Provable.if(poolExists, Balance, amoutOutWithoutFee, amountOut)
          .value as any
      );

      amountIn = UInt64.from(
        Provable.if(poolExists, Balance, amountIn, Balance.zero).value as any
      );

      await this.balances.transfer(tokenIn, sender, lastPoolKey, amountIn);

      sender = lastPoolKey;
      amountIn = amountOut;
    }

    const isAmountOutMinLimitSufficient =
      amountOut.greaterThanOrEqual(amountOutMinLimit);

    assert(isAmountOutMinLimitSufficient, errors.amountOutIsInsufficient());

    await this.balances.transfer(lastTokenOut, lastPoolKey, seller, amountOut);
  }

  @runtimeMethod()
  public async createPoolSigned(
    tokenAId: TokenId,
    tokenBId: TokenId,
    tokenAAmount: Balance,
    tokenBAmount: Balance
  ) {
    const creator = this.transaction.sender.value;
    await this.createPool(
      creator,
      tokenAId,
      tokenBId,
      tokenAAmount,
      tokenBAmount
    );
    await this.poolWhitelist.set(
      {
        poolKey: PoolKey.fromTokenPair(TokenPair.from(tokenAId, tokenBId)),
        user: creator,
      },
      Bool(true)
    );
  }

  @runtimeMethod()
  public async addLiquiditySigned(
    tokenAId: TokenId,
    tokenBId: TokenId,
    tokenAAmount: Balance,
    tokenBAmountLimit: Balance
  ) {
    const provider = this.transaction.sender.value;
    await this.addLiquidity(
      provider,
      tokenAId,
      tokenBId,
      tokenAAmount,
      tokenBAmountLimit
    );
  }

  @runtimeMethod()
  public async removeLiquiditySigned(
    tokenAId: TokenId,
    tokenBId: TokenId,
    lpTokenAmount: Balance,
    tokenAAmountLimit: Balance,
    tokenBLAmountLimit: Balance
  ) {
    const provider = this.transaction.sender.value;
    await this.removeLiquidity(
      provider,
      tokenAId,
      tokenBId,
      lpTokenAmount,
      tokenAAmountLimit,
      tokenBLAmountLimit
    );
  }

  @runtimeMethod()
  public async sellPathSigned(
    path: TokenIdPath,
    amountIn: Balance,
    amountOutMinLimit: Balance
  ) {
    await this.sellPath(
      this.transaction.sender.value,
      path,
      amountIn,
      amountOutMinLimit
    );
  }

  /**
   * Whitelists a user for a pool. Here, we do not care whether the pool exists or not.
   *
   * @param user
   * @param poolKey
   */
  @runtimeMethod()
  public async whitelistUser(user: PublicKey, poolKey: PoolKey) {
    await this.poolWhitelist.set({ user, poolKey }, Bool(true));
  }

  /**
   * Dewhitelists a user for a pool. Here, we do not care whether the pool exists or not.
   *
   * @param user
   * @param poolKey
   */
  @runtimeMethod()
  public async dewhitelistUser(user: PublicKey, poolKey: PoolKey) {
    await this.poolWhitelist.set({ user, poolKey }, Bool(false));
  }
}
