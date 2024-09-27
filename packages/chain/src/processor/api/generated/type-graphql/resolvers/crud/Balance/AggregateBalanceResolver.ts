import * as TypeGraphQL from "type-graphql";
import type { GraphQLResolveInfo } from "graphql";
import { AggregateBalanceArgs } from "./args/AggregateBalanceArgs";
import { Balance } from "../../../models/Balance";
import { AggregateBalance } from "../../outputs/AggregateBalance";
import { transformInfoIntoPrismaArgs, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Balance)
export class AggregateBalanceResolver {
  @TypeGraphQL.Query(_returns => AggregateBalance, {
    nullable: false
  })
  async aggregateBalance(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: AggregateBalanceArgs): Promise<AggregateBalance> {
    return getPrismaFromContext(ctx).balance.aggregate({
      ...args,
      ...transformInfoIntoPrismaArgs(info),
    });
  }
}
