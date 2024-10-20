import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BlockOrderByWithAggregationInput } from "../../../inputs/BlockOrderByWithAggregationInput";
import { BlockScalarWhereWithAggregatesInput } from "../../../inputs/BlockScalarWhereWithAggregatesInput";
import { BlockWhereInput } from "../../../inputs/BlockWhereInput";
import { BlockScalarFieldEnum } from "../../../../enums/BlockScalarFieldEnum";

@TypeGraphQL.ArgsType()
export class GroupByBlockArgs {
  @TypeGraphQL.Field(_type => BlockWhereInput, {
    nullable: true
  })
  where?: BlockWhereInput | undefined;

  @TypeGraphQL.Field(_type => [BlockOrderByWithAggregationInput], {
    nullable: true
  })
  orderBy?: BlockOrderByWithAggregationInput[] | undefined;

  @TypeGraphQL.Field(_type => [BlockScalarFieldEnum], {
    nullable: false
  })
  by!: "height"[];

  @TypeGraphQL.Field(_type => BlockScalarWhereWithAggregatesInput, {
    nullable: true
  })
  having?: BlockScalarWhereWithAggregatesInput | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  take?: number | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  skip?: number | undefined;
}
