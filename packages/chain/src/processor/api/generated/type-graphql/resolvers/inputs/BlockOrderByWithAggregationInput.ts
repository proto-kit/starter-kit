import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-processor";
import { DecimalJSScalar } from "../../scalars";
import { BlockAvgOrderByAggregateInput } from "../inputs/BlockAvgOrderByAggregateInput";
import { BlockCountOrderByAggregateInput } from "../inputs/BlockCountOrderByAggregateInput";
import { BlockMaxOrderByAggregateInput } from "../inputs/BlockMaxOrderByAggregateInput";
import { BlockMinOrderByAggregateInput } from "../inputs/BlockMinOrderByAggregateInput";
import { BlockSumOrderByAggregateInput } from "../inputs/BlockSumOrderByAggregateInput";
import { SortOrder } from "../../enums/SortOrder";

@TypeGraphQL.InputType("BlockOrderByWithAggregationInput", {})
export class BlockOrderByWithAggregationInput {
  @TypeGraphQL.Field(_type => SortOrder, {
    nullable: true
  })
  height?: "asc" | "desc" | undefined;

  @TypeGraphQL.Field(_type => BlockCountOrderByAggregateInput, {
    nullable: true
  })
  _count?: BlockCountOrderByAggregateInput | undefined;

  @TypeGraphQL.Field(_type => BlockAvgOrderByAggregateInput, {
    nullable: true
  })
  _avg?: BlockAvgOrderByAggregateInput | undefined;

  @TypeGraphQL.Field(_type => BlockMaxOrderByAggregateInput, {
    nullable: true
  })
  _max?: BlockMaxOrderByAggregateInput | undefined;

  @TypeGraphQL.Field(_type => BlockMinOrderByAggregateInput, {
    nullable: true
  })
  _min?: BlockMinOrderByAggregateInput | undefined;

  @TypeGraphQL.Field(_type => BlockSumOrderByAggregateInput, {
    nullable: true
  })
  _sum?: BlockSumOrderByAggregateInput | undefined;
}
