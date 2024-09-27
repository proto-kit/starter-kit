import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "../../../../../../../node_modules/@prisma/client-indexer";
import { DecimalJSScalar } from "../../scalars";
import { BlockAvgAggregate } from "../outputs/BlockAvgAggregate";
import { BlockCountAggregate } from "../outputs/BlockCountAggregate";
import { BlockMaxAggregate } from "../outputs/BlockMaxAggregate";
import { BlockMinAggregate } from "../outputs/BlockMinAggregate";
import { BlockSumAggregate } from "../outputs/BlockSumAggregate";

@TypeGraphQL.ObjectType("AggregateBlock", {})
export class AggregateBlock {
  @TypeGraphQL.Field(_type => BlockCountAggregate, {
    nullable: true
  })
  _count!: BlockCountAggregate | null;

  @TypeGraphQL.Field(_type => BlockAvgAggregate, {
    nullable: true
  })
  _avg!: BlockAvgAggregate | null;

  @TypeGraphQL.Field(_type => BlockSumAggregate, {
    nullable: true
  })
  _sum!: BlockSumAggregate | null;

  @TypeGraphQL.Field(_type => BlockMinAggregate, {
    nullable: true
  })
  _min!: BlockMinAggregate | null;

  @TypeGraphQL.Field(_type => BlockMaxAggregate, {
    nullable: true
  })
  _max!: BlockMaxAggregate | null;
}
