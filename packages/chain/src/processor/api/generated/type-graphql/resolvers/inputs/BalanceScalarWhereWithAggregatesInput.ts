import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-processor";
import { DecimalJSScalar } from "../../scalars";
import { IntWithAggregatesFilter } from "../inputs/IntWithAggregatesFilter";
import { StringWithAggregatesFilter } from "../inputs/StringWithAggregatesFilter";

@TypeGraphQL.InputType("BalanceScalarWhereWithAggregatesInput", {})
export class BalanceScalarWhereWithAggregatesInput {
  @TypeGraphQL.Field(_type => [BalanceScalarWhereWithAggregatesInput], {
    nullable: true
  })
  AND?: BalanceScalarWhereWithAggregatesInput[] | undefined;

  @TypeGraphQL.Field(_type => [BalanceScalarWhereWithAggregatesInput], {
    nullable: true
  })
  OR?: BalanceScalarWhereWithAggregatesInput[] | undefined;

  @TypeGraphQL.Field(_type => [BalanceScalarWhereWithAggregatesInput], {
    nullable: true
  })
  NOT?: BalanceScalarWhereWithAggregatesInput[] | undefined;

  @TypeGraphQL.Field(_type => IntWithAggregatesFilter, {
    nullable: true
  })
  height?: IntWithAggregatesFilter | undefined;

  @TypeGraphQL.Field(_type => StringWithAggregatesFilter, {
    nullable: true
  })
  address?: StringWithAggregatesFilter | undefined;

  @TypeGraphQL.Field(_type => StringWithAggregatesFilter, {
    nullable: true
  })
  amount?: StringWithAggregatesFilter | undefined;
}
