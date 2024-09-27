import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BlockCreateManyInput } from "../../../inputs/BlockCreateManyInput";

@TypeGraphQL.ArgsType()
export class CreateManyAndReturnBlockArgs {
  @TypeGraphQL.Field(_type => [BlockCreateManyInput], {
    nullable: false
  })
  data!: BlockCreateManyInput[];

  @TypeGraphQL.Field(_type => Boolean, {
    nullable: true
  })
  skipDuplicates?: boolean | undefined;
}
