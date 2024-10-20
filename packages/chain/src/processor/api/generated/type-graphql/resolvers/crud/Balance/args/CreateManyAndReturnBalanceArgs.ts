import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BalanceCreateManyInput } from "../../../inputs/BalanceCreateManyInput";

@TypeGraphQL.ArgsType()
export class CreateManyAndReturnBalanceArgs {
  @TypeGraphQL.Field(_type => [BalanceCreateManyInput], {
    nullable: false
  })
  data!: BalanceCreateManyInput[];

  @TypeGraphQL.Field(_type => Boolean, {
    nullable: true
  })
  skipDuplicates?: boolean | undefined;
}
