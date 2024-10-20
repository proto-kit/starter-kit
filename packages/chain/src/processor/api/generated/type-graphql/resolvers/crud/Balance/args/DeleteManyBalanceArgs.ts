import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BalanceWhereInput } from "../../../inputs/BalanceWhereInput";

@TypeGraphQL.ArgsType()
export class DeleteManyBalanceArgs {
  @TypeGraphQL.Field(_type => BalanceWhereInput, {
    nullable: true
  })
  where?: BalanceWhereInput | undefined;
}
