import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-processor";
import { DecimalJSScalar } from "../../scalars";
import { IntWithAggregatesFilter } from "../inputs/IntWithAggregatesFilter";

@TypeGraphQL.InputType("BlockScalarWhereWithAggregatesInput", {})
export class BlockScalarWhereWithAggregatesInput {
  @TypeGraphQL.Field(_type => [BlockScalarWhereWithAggregatesInput], {
    nullable: true
  })
  AND?: BlockScalarWhereWithAggregatesInput[] | undefined;

  @TypeGraphQL.Field(_type => [BlockScalarWhereWithAggregatesInput], {
    nullable: true
  })
  OR?: BlockScalarWhereWithAggregatesInput[] | undefined;

  @TypeGraphQL.Field(_type => [BlockScalarWhereWithAggregatesInput], {
    nullable: true
  })
  NOT?: BlockScalarWhereWithAggregatesInput[] | undefined;

  @TypeGraphQL.Field(_type => IntWithAggregatesFilter, {
    nullable: true
  })
  height?: IntWithAggregatesFilter | undefined;
}
