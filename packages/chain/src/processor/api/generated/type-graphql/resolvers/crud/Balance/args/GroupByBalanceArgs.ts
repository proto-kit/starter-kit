import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BalanceOrderByWithAggregationInput } from "../../../inputs/BalanceOrderByWithAggregationInput";
import { BalanceScalarWhereWithAggregatesInput } from "../../../inputs/BalanceScalarWhereWithAggregatesInput";
import { BalanceWhereInput } from "../../../inputs/BalanceWhereInput";
import { BalanceScalarFieldEnum } from "../../../../enums/BalanceScalarFieldEnum";

@TypeGraphQL.ArgsType()
export class GroupByBalanceArgs {
  @TypeGraphQL.Field(_type => BalanceWhereInput, {
    nullable: true
  })
  where?: BalanceWhereInput | undefined;

  @TypeGraphQL.Field(_type => [BalanceOrderByWithAggregationInput], {
    nullable: true
  })
  orderBy?: BalanceOrderByWithAggregationInput[] | undefined;

  @TypeGraphQL.Field(_type => [BalanceScalarFieldEnum], {
    nullable: false
  })
  by!: Array<"height" | "address" | "amount">;

  @TypeGraphQL.Field(_type => BalanceScalarWhereWithAggregatesInput, {
    nullable: true
  })
  having?: BalanceScalarWhereWithAggregatesInput | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  take?: number | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  skip?: number | undefined;
}
