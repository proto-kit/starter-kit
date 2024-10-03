import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-processor";
import { DecimalJSScalar } from "../../scalars";

@TypeGraphQL.InputType("StringFieldUpdateOperationsInput", {})
export class StringFieldUpdateOperationsInput {
  @TypeGraphQL.Field(_type => String, {
    nullable: true
  })
  set?: string | undefined;
}
