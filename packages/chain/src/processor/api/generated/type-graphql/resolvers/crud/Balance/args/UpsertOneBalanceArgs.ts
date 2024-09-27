import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BalanceCreateInput } from "../../../inputs/BalanceCreateInput";
import { BalanceUpdateInput } from "../../../inputs/BalanceUpdateInput";
import { BalanceWhereUniqueInput } from "../../../inputs/BalanceWhereUniqueInput";

@TypeGraphQL.ArgsType()
export class UpsertOneBalanceArgs {
  @TypeGraphQL.Field(_type => BalanceWhereUniqueInput, {
    nullable: false
  })
  where!: BalanceWhereUniqueInput;

  @TypeGraphQL.Field(_type => BalanceCreateInput, {
    nullable: false
  })
  create!: BalanceCreateInput;

  @TypeGraphQL.Field(_type => BalanceUpdateInput, {
    nullable: false
  })
  update!: BalanceUpdateInput;
}
