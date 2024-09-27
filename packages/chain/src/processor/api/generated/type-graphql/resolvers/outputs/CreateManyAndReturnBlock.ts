import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-indexer";
import { DecimalJSScalar } from "../../scalars";

@TypeGraphQL.ObjectType("CreateManyAndReturnBlock", {})
export class CreateManyAndReturnBlock {
  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  height!: number;
}
