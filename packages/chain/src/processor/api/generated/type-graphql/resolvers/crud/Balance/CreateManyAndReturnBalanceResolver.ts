import * as TypeGraphQL from "type-graphql";
import type { GraphQLResolveInfo } from "graphql";
import { CreateManyAndReturnBalanceArgs } from "./args/CreateManyAndReturnBalanceArgs";
import { Balance } from "../../../models/Balance";
import { CreateManyAndReturnBalance } from "../../outputs/CreateManyAndReturnBalance";
import { transformInfoIntoPrismaArgs, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Balance)
export class CreateManyAndReturnBalanceResolver {
  @TypeGraphQL.Mutation(_returns => [CreateManyAndReturnBalance], {
    nullable: false
  })
  async createManyAndReturnBalance(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: CreateManyAndReturnBalanceArgs): Promise<CreateManyAndReturnBalance[]> {
    const { _count } = transformInfoIntoPrismaArgs(info);
    return getPrismaFromContext(ctx).balance.createManyAndReturn({
      ...args,
      ...(_count && transformCountFieldIntoSelectRelationsCount(_count)),
    });
  }
}
