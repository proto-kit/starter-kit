import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BlockCreateInput } from "../../../inputs/BlockCreateInput";
import { BlockUpdateInput } from "../../../inputs/BlockUpdateInput";
import { BlockWhereUniqueInput } from "../../../inputs/BlockWhereUniqueInput";

@TypeGraphQL.ArgsType()
export class UpsertOneBlockArgs {
  @TypeGraphQL.Field(_type => BlockWhereUniqueInput, {
    nullable: false
  })
  where!: BlockWhereUniqueInput;

  @TypeGraphQL.Field(_type => BlockCreateInput, {
    nullable: false
  })
  create!: BlockCreateInput;

  @TypeGraphQL.Field(_type => BlockUpdateInput, {
    nullable: false
  })
  update!: BlockUpdateInput;
}
