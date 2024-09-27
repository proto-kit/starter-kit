import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-indexer";
import { DecimalJSScalar } from "../../scalars";

@TypeGraphQL.InputType("BlockCreateInput", {})
export class BlockCreateInput {
  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  height!: number;
}
