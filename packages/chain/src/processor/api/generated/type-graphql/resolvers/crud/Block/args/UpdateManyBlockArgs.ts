import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BlockUpdateManyMutationInput } from "../../../inputs/BlockUpdateManyMutationInput";
import { BlockWhereInput } from "../../../inputs/BlockWhereInput";

@TypeGraphQL.ArgsType()
export class UpdateManyBlockArgs {
  @TypeGraphQL.Field(_type => BlockUpdateManyMutationInput, {
    nullable: false
  })
  data!: BlockUpdateManyMutationInput;

  @TypeGraphQL.Field(_type => BlockWhereInput, {
    nullable: true
  })
  where?: BlockWhereInput | undefined;
}
