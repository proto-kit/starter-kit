import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-indexer";
import { DecimalJSScalar } from "../../scalars";
import { BalanceAvgAggregate } from "../outputs/BalanceAvgAggregate";
import { BalanceCountAggregate } from "../outputs/BalanceCountAggregate";
import { BalanceMaxAggregate } from "../outputs/BalanceMaxAggregate";
import { BalanceMinAggregate } from "../outputs/BalanceMinAggregate";
import { BalanceSumAggregate } from "../outputs/BalanceSumAggregate";

@TypeGraphQL.ObjectType("BalanceGroupBy", {})
export class BalanceGroupBy {
  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  height!: number;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  address!: string;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  amount!: string;

  @TypeGraphQL.Field(_type => BalanceCountAggregate, {
    nullable: true
  })
  _count!: BalanceCountAggregate | null;

  @TypeGraphQL.Field(_type => BalanceAvgAggregate, {
    nullable: true
  })
  _avg!: BalanceAvgAggregate | null;

  @TypeGraphQL.Field(_type => BalanceSumAggregate, {
    nullable: true
  })
  _sum!: BalanceSumAggregate | null;

  @TypeGraphQL.Field(_type => BalanceMinAggregate, {
    nullable: true
  })
  _min!: BalanceMinAggregate | null;

  @TypeGraphQL.Field(_type => BalanceMaxAggregate, {
    nullable: true
  })
  _max!: BalanceMaxAggregate | null;
}
