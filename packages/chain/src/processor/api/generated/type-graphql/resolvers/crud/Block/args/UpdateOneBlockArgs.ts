import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BlockUpdateInput } from "../../../inputs/BlockUpdateInput";
import { BlockWhereUniqueInput } from "../../../inputs/BlockWhereUniqueInput";

@TypeGraphQL.ArgsType()
export class UpdateOneBlockArgs {
  @TypeGraphQL.Field(_type => BlockUpdateInput, {
    nullable: false
  })
  data!: BlockUpdateInput;

  @TypeGraphQL.Field(_type => BlockWhereUniqueInput, {
    nullable: false
  })
  where!: BlockWhereUniqueInput;
}
