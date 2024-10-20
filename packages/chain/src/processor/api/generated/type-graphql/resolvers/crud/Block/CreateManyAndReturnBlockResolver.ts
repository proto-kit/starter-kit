import * as TypeGraphQL from "type-graphql";
import type { GraphQLResolveInfo } from "graphql";
import { CreateManyAndReturnBlockArgs } from "./args/CreateManyAndReturnBlockArgs";
import { Block } from "../../../models/Block";
import { CreateManyAndReturnBlock } from "../../outputs/CreateManyAndReturnBlock";
import { transformInfoIntoPrismaArgs, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Block)
export class CreateManyAndReturnBlockResolver {
  @TypeGraphQL.Mutation(_returns => [CreateManyAndReturnBlock], {
    nullable: false
  })
  async createManyAndReturnBlock(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: CreateManyAndReturnBlockArgs): Promise<CreateManyAndReturnBlock[]> {
    const { _count } = transformInfoIntoPrismaArgs(info);
    return getPrismaFromContext(ctx).block.createManyAndReturn({
      ...args,
      ...(_count && transformCountFieldIntoSelectRelationsCount(_count)),
    });
  }
}
