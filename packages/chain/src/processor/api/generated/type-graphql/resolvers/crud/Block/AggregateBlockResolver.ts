import * as TypeGraphQL from "type-graphql";
import type { GraphQLResolveInfo } from "graphql";
import { AggregateBlockArgs } from "./args/AggregateBlockArgs";
import { Block } from "../../../models/Block";
import { AggregateBlock } from "../../outputs/AggregateBlock";
import { transformInfoIntoPrismaArgs, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Block)
export class AggregateBlockResolver {
  @TypeGraphQL.Query(_returns => AggregateBlock, {
    nullable: false
  })
  async aggregateBlock(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: AggregateBlockArgs): Promise<AggregateBlock> {
    return getPrismaFromContext(ctx).block.aggregate({
      ...args,
      ...transformInfoIntoPrismaArgs(info),
    });
  }
}
