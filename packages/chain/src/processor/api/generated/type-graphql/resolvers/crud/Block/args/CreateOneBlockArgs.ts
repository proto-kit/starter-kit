import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BlockCreateInput } from "../../../inputs/BlockCreateInput";

@TypeGraphQL.ArgsType()
export class CreateOneBlockArgs {
  @TypeGraphQL.Field(_type => BlockCreateInput, {
    nullable: false
  })
  data!: BlockCreateInput;
}
