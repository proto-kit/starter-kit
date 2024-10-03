import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-processor";
import { DecimalJSScalar } from "../../scalars";
import { BalanceAvgAggregate } from "../outputs/BalanceAvgAggregate";
import { BalanceCountAggregate } from "../outputs/BalanceCountAggregate";
import { BalanceMaxAggregate } from "../outputs/BalanceMaxAggregate";
import { BalanceMinAggregate } from "../outputs/BalanceMinAggregate";
import { BalanceSumAggregate } from "../outputs/BalanceSumAggregate";

@TypeGraphQL.ObjectType("AggregateBalance", {})
export class AggregateBalance {
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
