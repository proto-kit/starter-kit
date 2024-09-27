import * as crudResolversImport from "./resolvers/crud/resolvers-crud.index";
import { NonEmptyArray } from "type-graphql";

export * from "./enums";
export * from "./models";
export * from "./resolvers/crud";

export const crudResolvers = Object.values(crudResolversImport) as unknown as NonEmptyArray<Function>;

export * from "./resolvers/inputs";
export * from "./resolvers/outputs";
export * from "./enhance";
export * from "./scalars";

export const resolvers = [
  ...crudResolvers,

] as unknown as NonEmptyArray<Function>;
