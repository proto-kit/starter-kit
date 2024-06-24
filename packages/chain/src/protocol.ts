import { VanillaProtocolModulesRecord } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";
import { PrivateKey } from "o1js";

const modules = {};

const config: ModulesConfig<typeof modules> & Partial<ModulesConfig<VanillaProtocolModulesRecord>> = {
    TransactionFee: {
        tokenId: 0n,
        feeRecipient: PrivateKey.random().toPublicKey().toBase58(),
        baseFee: 0n,
        perWeightUnitFee: 0n,
        methods: {},
    }
}

export default { modules, config }