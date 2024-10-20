import * as TypeGraphQL from "type-graphql";

export enum BalanceScalarFieldEnum {
  height = "height",
  address = "address",
  amount = "amount"
}
TypeGraphQL.registerEnumType(BalanceScalarFieldEnum, {
  name: "BalanceScalarFieldEnum",
  description: undefined,
});
