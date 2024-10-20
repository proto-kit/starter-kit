import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { BalanceUpdateManyMutationInput } from "../../../inputs/BalanceUpdateManyMutationInput";
import { BalanceWhereInput } from "../../../inputs/BalanceWhereInput";

@TypeGraphQL.ArgsType()
export class UpdateManyBalanceArgs {
  @TypeGraphQL.Field(_type => BalanceUpdateManyMutationInput, {
    nullable: false
  })
  data!: BalanceUpdateManyMutationInput;

  @TypeGraphQL.Field(_type => BalanceWhereInput, {
    nullable: true
  })
  where?: BalanceWhereInput | undefined;
}
