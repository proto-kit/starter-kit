import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BalanceCreateInput } from "../../../inputs/BalanceCreateInput";

@TypeGraphQL.ArgsType()
export class CreateOneBalanceArgs {
  @TypeGraphQL.Field(_type => BalanceCreateInput, {
    nullable: false
  })
  data!: BalanceCreateInput;
}
