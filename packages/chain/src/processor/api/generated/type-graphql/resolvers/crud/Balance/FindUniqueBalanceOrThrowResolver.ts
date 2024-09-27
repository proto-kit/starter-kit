import * as TypeGraphQL from "type-graphql";
import type { GraphQLResolveInfo } from "graphql";
import { FindUniqueBalanceOrThrowArgs } from "./args/FindUniqueBalanceOrThrowArgs";
import { Balance } from "../../../models/Balance";
import { transformInfoIntoPrismaArgs, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Balance)
export class FindUniqueBalanceOrThrowResolver {
  @TypeGraphQL.Query(_returns => Balance, {
    nullable: true
  })
  async getBalance(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: FindUniqueBalanceOrThrowArgs): Promise<Balance | null> {
    const { _count } = transformInfoIntoPrismaArgs(info);
    return getPrismaFromContext(ctx).balance.findUniqueOrThrow({
      ...args,
      ...(_count && transformCountFieldIntoSelectRelationsCount(_count)),
    });
  }
}
