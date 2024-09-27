import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-indexer";
import { DecimalJSScalar } from "../../scalars";
import { IntFilter } from "../inputs/IntFilter";
import { StringFilter } from "../inputs/StringFilter";

@TypeGraphQL.InputType("BalanceWhereInput", {})
export class BalanceWhereInput {
  @TypeGraphQL.Field(_type => [BalanceWhereInput], {
    nullable: true
  })
  AND?: BalanceWhereInput[] | undefined;

  @TypeGraphQL.Field(_type => [BalanceWhereInput], {
    nullable: true
  })
  OR?: BalanceWhereInput[] | undefined;

  @TypeGraphQL.Field(_type => [BalanceWhereInput], {
    nullable: true
  })
  NOT?: BalanceWhereInput[] | undefined;

  @TypeGraphQL.Field(_type => IntFilter, {
    nullable: true
  })
  height?: IntFilter | undefined;

  @TypeGraphQL.Field(_type => StringFilter, {
    nullable: true
  })
  address?: StringFilter | undefined;

  @TypeGraphQL.Field(_type => StringFilter, {
    nullable: true
  })
  amount?: StringFilter | undefined;
}
