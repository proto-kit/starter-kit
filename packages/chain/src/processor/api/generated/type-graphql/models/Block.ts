import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../node_modules/@prisma/client-processor";
import { DecimalJSScalar } from "../scalars";

@TypeGraphQL.ObjectType("Block", {})
export class Block {
  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  height!: number;
}
