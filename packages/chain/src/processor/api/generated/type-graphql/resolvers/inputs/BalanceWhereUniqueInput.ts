import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-indexer";
import { DecimalJSScalar } from "../../scalars";
import { BalanceHeightAddressCompoundUniqueInput } from "../inputs/BalanceHeightAddressCompoundUniqueInput";
import { BalanceWhereInput } from "../inputs/BalanceWhereInput";
import { IntFilter } from "../inputs/IntFilter";
import { StringFilter } from "../inputs/StringFilter";

@TypeGraphQL.InputType("BalanceWhereUniqueInput", {})
export class BalanceWhereUniqueInput {
  @TypeGraphQL.Field(_type => BalanceHeightAddressCompoundUniqueInput, {
    nullable: true
  })
  height_address?: BalanceHeightAddressCompoundUniqueInput | undefined;

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
