import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-indexer";
import { DecimalJSScalar } from "../../scalars";
import { BalanceAvgOrderByAggregateInput } from "../inputs/BalanceAvgOrderByAggregateInput";
import { BalanceCountOrderByAggregateInput } from "../inputs/BalanceCountOrderByAggregateInput";
import { BalanceMaxOrderByAggregateInput } from "../inputs/BalanceMaxOrderByAggregateInput";
import { BalanceMinOrderByAggregateInput } from "../inputs/BalanceMinOrderByAggregateInput";
import { BalanceSumOrderByAggregateInput } from "../inputs/BalanceSumOrderByAggregateInput";
import { SortOrder } from "../../enums/SortOrder";

@TypeGraphQL.InputType("BalanceOrderByWithAggregationInput", {})
export class BalanceOrderByWithAggregationInput {
  @TypeGraphQL.Field(_type => SortOrder, {
    nullable: true
  })
  height?: "asc" | "desc" | undefined;

  @TypeGraphQL.Field(_type => SortOrder, {
    nullable: true
  })
  address?: "asc" | "desc" | undefined;

  @TypeGraphQL.Field(_type => SortOrder, {
    nullable: true
  })
  amount?: "asc" | "desc" | undefined;

  @TypeGraphQL.Field(_type => BalanceCountOrderByAggregateInput, {
    nullable: true
  })
  _count?: BalanceCountOrderByAggregateInput | undefined;

  @TypeGraphQL.Field(_type => BalanceAvgOrderByAggregateInput, {
    nullable: true
  })
  _avg?: BalanceAvgOrderByAggregateInput | undefined;

  @TypeGraphQL.Field(_type => BalanceMaxOrderByAggregateInput, {
    nullable: true
  })
  _max?: BalanceMaxOrderByAggregateInput | undefined;

  @TypeGraphQL.Field(_type => BalanceMinOrderByAggregateInput, {
    nullable: true
  })
  _min?: BalanceMinOrderByAggregateInput | undefined;

  @TypeGraphQL.Field(_type => BalanceSumOrderByAggregateInput, {
    nullable: true
  })
  _sum?: BalanceSumOrderByAggregateInput | undefined;
}
