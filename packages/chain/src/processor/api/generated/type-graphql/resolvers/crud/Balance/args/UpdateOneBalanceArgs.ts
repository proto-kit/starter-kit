import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BalanceUpdateInput } from "../../../inputs/BalanceUpdateInput";
import { BalanceWhereUniqueInput } from "../../../inputs/BalanceWhereUniqueInput";

@TypeGraphQL.ArgsType()
export class UpdateOneBalanceArgs {
  @TypeGraphQL.Field(_type => BalanceUpdateInput, {
    nullable: false
  })
  data!: BalanceUpdateInput;

  @TypeGraphQL.Field(_type => BalanceWhereUniqueInput, {
    nullable: false
  })
  where!: BalanceWhereUniqueInput;
}
