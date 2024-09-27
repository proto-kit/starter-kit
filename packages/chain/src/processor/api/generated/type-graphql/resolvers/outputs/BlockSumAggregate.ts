import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-indexer";
import { DecimalJSScalar } from "../../scalars";

@TypeGraphQL.ObjectType("BlockSumAggregate", {})
export class BlockSumAggregate {
  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  height!: number | null;
}
