import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BlockOrderByWithRelationInput } from "../../../inputs/BlockOrderByWithRelationInput";
import { BlockWhereInput } from "../../../inputs/BlockWhereInput";
import { BlockWhereUniqueInput } from "../../../inputs/BlockWhereUniqueInput";
import { BlockScalarFieldEnum } from "../../../../enums/BlockScalarFieldEnum";

@TypeGraphQL.ArgsType()
export class FindManyBlockArgs {
  @TypeGraphQL.Field(_type => BlockWhereInput, {
    nullable: true
  })
  where?: BlockWhereInput | undefined;

  @TypeGraphQL.Field(_type => [BlockOrderByWithRelationInput], {
    nullable: true
  })
  orderBy?: BlockOrderByWithRelationInput[] | undefined;

  @TypeGraphQL.Field(_type => BlockWhereUniqueInput, {
    nullable: true
  })
  cursor?: BlockWhereUniqueInput | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  take?: number | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  skip?: number | undefined;

  @TypeGraphQL.Field(_type => [BlockScalarFieldEnum], {
    nullable: true
  })
  distinct?: "height"[] | undefined;
}
