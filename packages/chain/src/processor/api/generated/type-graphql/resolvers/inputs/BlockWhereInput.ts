import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-indexer";
import { DecimalJSScalar } from "../../scalars";
import { IntFilter } from "../inputs/IntFilter";

@TypeGraphQL.InputType("BlockWhereInput", {})
export class BlockWhereInput {
  @TypeGraphQL.Field(_type => [BlockWhereInput], {
    nullable: true
  })
  AND?: BlockWhereInput[] | undefined;

  @TypeGraphQL.Field(_type => [BlockWhereInput], {
    nullable: true
  })
  OR?: BlockWhereInput[] | undefined;

  @TypeGraphQL.Field(_type => [BlockWhereInput], {
    nullable: true
  })
  NOT?: BlockWhereInput[] | undefined;

  @TypeGraphQL.Field(_type => IntFilter, {
    nullable: true
  })
  height?: IntFilter | undefined;
}
