import { ClassType } from "type-graphql";
import * as tslib from "tslib";
import * as crudResolvers from "./resolvers/crud/resolvers-crud.index";
import * as argsTypes from "./resolvers/crud/args.index";
import * as actionResolvers from "./resolvers/crud/resolvers-actions.index";
import * as models from "./models";
import * as outputTypes from "./resolvers/outputs";
import * as inputTypes from "./resolvers/inputs";

export type MethodDecoratorOverrideFn = (decorators: MethodDecorator[]) => MethodDecorator[];

const crudResolversMap = {
  Block: crudResolvers.BlockCrudResolver,
  Balance: crudResolvers.BalanceCrudResolver
};
const actionResolversMap = {
  Block: {
    aggregateBlock: actionResolvers.AggregateBlockResolver,
    createManyBlock: actionResolvers.CreateManyBlockResolver,
    createManyAndReturnBlock: actionResolvers.CreateManyAndReturnBlockResolver,
    createOneBlock: actionResolvers.CreateOneBlockResolver,
    deleteManyBlock: actionResolvers.DeleteManyBlockResolver,
    deleteOneBlock: actionResolvers.DeleteOneBlockResolver,
    findFirstBlock: actionResolvers.FindFirstBlockResolver,
    findFirstBlockOrThrow: actionResolvers.FindFirstBlockOrThrowResolver,
    blocks: actionResolvers.FindManyBlockResolver,
    block: actionResolvers.FindUniqueBlockResolver,
    getBlock: actionResolvers.FindUniqueBlockOrThrowResolver,
    groupByBlock: actionResolvers.GroupByBlockResolver,
    updateManyBlock: actionResolvers.UpdateManyBlockResolver,
    updateOneBlock: actionResolvers.UpdateOneBlockResolver,
    upsertOneBlock: actionResolvers.UpsertOneBlockResolver
  },
  Balance: {
    aggregateBalance: actionResolvers.AggregateBalanceResolver,
    createManyBalance: actionResolvers.CreateManyBalanceResolver,
    createManyAndReturnBalance: actionResolvers.CreateManyAndReturnBalanceResolver,
    createOneBalance: actionResolvers.CreateOneBalanceResolver,
    deleteManyBalance: actionResolvers.DeleteManyBalanceResolver,
    deleteOneBalance: actionResolvers.DeleteOneBalanceResolver,
    findFirstBalance: actionResolvers.FindFirstBalanceResolver,
    findFirstBalanceOrThrow: actionResolvers.FindFirstBalanceOrThrowResolver,
    balances: actionResolvers.FindManyBalanceResolver,
    balance: actionResolvers.FindUniqueBalanceResolver,
    getBalance: actionResolvers.FindUniqueBalanceOrThrowResolver,
    groupByBalance: actionResolvers.GroupByBalanceResolver,
    updateManyBalance: actionResolvers.UpdateManyBalanceResolver,
    updateOneBalance: actionResolvers.UpdateOneBalanceResolver,
    upsertOneBalance: actionResolvers.UpsertOneBalanceResolver
  }
};
const crudResolversInfo = {
  Block: ["aggregateBlock", "createManyBlock", "createManyAndReturnBlock", "createOneBlock", "deleteManyBlock", "deleteOneBlock", "findFirstBlock", "findFirstBlockOrThrow", "blocks", "block", "getBlock", "groupByBlock", "updateManyBlock", "updateOneBlock", "upsertOneBlock"],
  Balance: ["aggregateBalance", "createManyBalance", "createManyAndReturnBalance", "createOneBalance", "deleteManyBalance", "deleteOneBalance", "findFirstBalance", "findFirstBalanceOrThrow", "balances", "balance", "getBalance", "groupByBalance", "updateManyBalance", "updateOneBalance", "upsertOneBalance"]
};
const argsInfo = {
  AggregateBlockArgs: ["where", "orderBy", "cursor", "take", "skip"],
  CreateManyBlockArgs: ["data", "skipDuplicates"],
  CreateManyAndReturnBlockArgs: ["data", "skipDuplicates"],
  CreateOneBlockArgs: ["data"],
  DeleteManyBlockArgs: ["where"],
  DeleteOneBlockArgs: ["where"],
  FindFirstBlockArgs: ["where", "orderBy", "cursor", "take", "skip", "distinct"],
  FindFirstBlockOrThrowArgs: ["where", "orderBy", "cursor", "take", "skip", "distinct"],
  FindManyBlockArgs: ["where", "orderBy", "cursor", "take", "skip", "distinct"],
  FindUniqueBlockArgs: ["where"],
  FindUniqueBlockOrThrowArgs: ["where"],
  GroupByBlockArgs: ["where", "orderBy", "by", "having", "take", "skip"],
  UpdateManyBlockArgs: ["data", "where"],
  UpdateOneBlockArgs: ["data", "where"],
  UpsertOneBlockArgs: ["where", "create", "update"],
  AggregateBalanceArgs: ["where", "orderBy", "cursor", "take", "skip"],
  CreateManyBalanceArgs: ["data", "skipDuplicates"],
  CreateManyAndReturnBalanceArgs: ["data", "skipDuplicates"],
  CreateOneBalanceArgs: ["data"],
  DeleteManyBalanceArgs: ["where"],
  DeleteOneBalanceArgs: ["where"],
  FindFirstBalanceArgs: ["where", "orderBy", "cursor", "take", "skip", "distinct"],
  FindFirstBalanceOrThrowArgs: ["where", "orderBy", "cursor", "take", "skip", "distinct"],
  FindManyBalanceArgs: ["where", "orderBy", "cursor", "take", "skip", "distinct"],
  FindUniqueBalanceArgs: ["where"],
  FindUniqueBalanceOrThrowArgs: ["where"],
  GroupByBalanceArgs: ["where", "orderBy", "by", "having", "take", "skip"],
  UpdateManyBalanceArgs: ["data", "where"],
  UpdateOneBalanceArgs: ["data", "where"],
  UpsertOneBalanceArgs: ["where", "create", "update"]
};

type ResolverModelNames = keyof typeof crudResolversMap;

type ModelResolverActionNames<
  TModel extends ResolverModelNames
> = keyof typeof crudResolversMap[TModel]["prototype"];

export type ResolverActionsConfig<
  TModel extends ResolverModelNames
> = Partial<Record<ModelResolverActionNames<TModel>, MethodDecorator[] | MethodDecoratorOverrideFn>>
  & {
    _all?: MethodDecorator[];
    _query?: MethodDecorator[];
    _mutation?: MethodDecorator[];
  };

export type ResolversEnhanceMap = {
  [TModel in ResolverModelNames]?: ResolverActionsConfig<TModel>;
};

export function applyResolversEnhanceMap(
  resolversEnhanceMap: ResolversEnhanceMap,
) {
  const mutationOperationPrefixes = [
    "createOne", "createMany", "createManyAndReturn", "deleteOne", "updateOne", "deleteMany", "updateMany", "upsertOne"
  ];
  for (const resolversEnhanceMapKey of Object.keys(resolversEnhanceMap)) {
    const modelName = resolversEnhanceMapKey as keyof typeof resolversEnhanceMap;
    const crudTarget = crudResolversMap[modelName].prototype;
    const resolverActionsConfig = resolversEnhanceMap[modelName]!;
    const actionResolversConfig = actionResolversMap[modelName];
    const allActionsDecorators = resolverActionsConfig._all;
    const resolverActionNames = crudResolversInfo[modelName as keyof typeof crudResolversInfo];
    for (const resolverActionName of resolverActionNames) {
      const maybeDecoratorsOrFn = resolverActionsConfig[
        resolverActionName as keyof typeof resolverActionsConfig
      ] as MethodDecorator[] | MethodDecoratorOverrideFn | undefined;
      const isWriteOperation = mutationOperationPrefixes.some(prefix => resolverActionName.startsWith(prefix));
      const operationKindDecorators = isWriteOperation ? resolverActionsConfig._mutation : resolverActionsConfig._query;
      const mainDecorators = [
        ...allActionsDecorators ?? [],
        ...operationKindDecorators ?? [],
      ]
      let decorators: MethodDecorator[];
      if (typeof maybeDecoratorsOrFn === "function") {
        decorators = maybeDecoratorsOrFn(mainDecorators);
      } else {
        decorators = [...mainDecorators, ...maybeDecoratorsOrFn ?? []];
      }
      const actionTarget = (actionResolversConfig[
        resolverActionName as keyof typeof actionResolversConfig
      ] as Function).prototype;
      tslib.__decorate(decorators, crudTarget, resolverActionName, null);
      tslib.__decorate(decorators, actionTarget, resolverActionName, null);
    }
  }
}

type ArgsTypesNames = keyof typeof argsTypes;

type ArgFieldNames<TArgsType extends ArgsTypesNames> = Exclude<
  keyof typeof argsTypes[TArgsType]["prototype"],
  number | symbol
>;

type ArgFieldsConfig<
  TArgsType extends ArgsTypesNames
> = FieldsConfig<ArgFieldNames<TArgsType>>;

export type ArgConfig<TArgsType extends ArgsTypesNames> = {
  class?: ClassDecorator[];
  fields?: ArgFieldsConfig<TArgsType>;
};

export type ArgsTypesEnhanceMap = {
  [TArgsType in ArgsTypesNames]?: ArgConfig<TArgsType>;
};

export function applyArgsTypesEnhanceMap(
  argsTypesEnhanceMap: ArgsTypesEnhanceMap,
) {
  for (const argsTypesEnhanceMapKey of Object.keys(argsTypesEnhanceMap)) {
    const argsTypeName = argsTypesEnhanceMapKey as keyof typeof argsTypesEnhanceMap;
    const typeConfig = argsTypesEnhanceMap[argsTypeName]!;
    const typeClass = argsTypes[argsTypeName];
    const typeTarget = typeClass.prototype;
    applyTypeClassEnhanceConfig(
      typeConfig,
      typeClass,
      typeTarget,
      argsInfo[argsTypeName as keyof typeof argsInfo],
    );
  }
}

type TypeConfig = {
  class?: ClassDecorator[];
  fields?: FieldsConfig;
};

export type PropertyDecoratorOverrideFn = (decorators: PropertyDecorator[]) => PropertyDecorator[];

type FieldsConfig<TTypeKeys extends string = string> = Partial<
  Record<TTypeKeys, PropertyDecorator[] | PropertyDecoratorOverrideFn>
> & { _all?: PropertyDecorator[] };

function applyTypeClassEnhanceConfig<
  TEnhanceConfig extends TypeConfig,
  TType extends object
>(
  enhanceConfig: TEnhanceConfig,
  typeClass: ClassType<TType>,
  typePrototype: TType,
  typeFieldNames: string[]
) {
  if (enhanceConfig.class) {
    tslib.__decorate(enhanceConfig.class, typeClass);
  }
  if (enhanceConfig.fields) {
    const allFieldsDecorators = enhanceConfig.fields._all ?? [];
    for (const typeFieldName of typeFieldNames) {
      const maybeDecoratorsOrFn = enhanceConfig.fields[
        typeFieldName
      ] as PropertyDecorator[] | PropertyDecoratorOverrideFn | undefined;
      let decorators: PropertyDecorator[];
      if (typeof maybeDecoratorsOrFn === "function") {
        decorators = maybeDecoratorsOrFn(allFieldsDecorators);
      } else {
        decorators = [...allFieldsDecorators, ...maybeDecoratorsOrFn ?? []];
      }
      tslib.__decorate(decorators, typePrototype, typeFieldName, void 0);
    }
  }
}

const modelsInfo = {
  Block: ["height"],
  Balance: ["height", "address", "amount"]
};

type ModelNames = keyof typeof models;

type ModelFieldNames<TModel extends ModelNames> = Exclude<
  keyof typeof models[TModel]["prototype"],
  number | symbol
>;

type ModelFieldsConfig<TModel extends ModelNames> = FieldsConfig<
  ModelFieldNames<TModel>
>;

export type ModelConfig<TModel extends ModelNames> = {
  class?: ClassDecorator[];
  fields?: ModelFieldsConfig<TModel>;
};

export type ModelsEnhanceMap = {
  [TModel in ModelNames]?: ModelConfig<TModel>;
};

export function applyModelsEnhanceMap(modelsEnhanceMap: ModelsEnhanceMap) {
  for (const modelsEnhanceMapKey of Object.keys(modelsEnhanceMap)) {
    const modelName = modelsEnhanceMapKey as keyof typeof modelsEnhanceMap;
    const modelConfig = modelsEnhanceMap[modelName]!;
    const modelClass = models[modelName];
    const modelTarget = modelClass.prototype;
    applyTypeClassEnhanceConfig(
      modelConfig,
      modelClass,
      modelTarget,
      modelsInfo[modelName as keyof typeof modelsInfo],
    );
  }
}

const outputsInfo = {
  AggregateBlock: ["_count", "_avg", "_sum", "_min", "_max"],
  BlockGroupBy: ["height", "_count", "_avg", "_sum", "_min", "_max"],
  AggregateBalance: ["_count", "_avg", "_sum", "_min", "_max"],
  BalanceGroupBy: ["height", "address", "amount", "_count", "_avg", "_sum", "_min", "_max"],
  AffectedRowsOutput: ["count"],
  BlockCountAggregate: ["height", "_all"],
  BlockAvgAggregate: ["height"],
  BlockSumAggregate: ["height"],
  BlockMinAggregate: ["height"],
  BlockMaxAggregate: ["height"],
  BalanceCountAggregate: ["height", "address", "amount", "_all"],
  BalanceAvgAggregate: ["height"],
  BalanceSumAggregate: ["height"],
  BalanceMinAggregate: ["height", "address", "amount"],
  BalanceMaxAggregate: ["height", "address", "amount"],
  CreateManyAndReturnBlock: ["height"],
  CreateManyAndReturnBalance: ["height", "address", "amount"]
};

type OutputTypesNames = keyof typeof outputTypes;

type OutputTypeFieldNames<TOutput extends OutputTypesNames> = Exclude<
  keyof typeof outputTypes[TOutput]["prototype"],
  number | symbol
>;

type OutputTypeFieldsConfig<
  TOutput extends OutputTypesNames
> = FieldsConfig<OutputTypeFieldNames<TOutput>>;

export type OutputTypeConfig<TOutput extends OutputTypesNames> = {
  class?: ClassDecorator[];
  fields?: OutputTypeFieldsConfig<TOutput>;
};

export type OutputTypesEnhanceMap = {
  [TOutput in OutputTypesNames]?: OutputTypeConfig<TOutput>;
};

export function applyOutputTypesEnhanceMap(
  outputTypesEnhanceMap: OutputTypesEnhanceMap,
) {
  for (const outputTypeEnhanceMapKey of Object.keys(outputTypesEnhanceMap)) {
    const outputTypeName = outputTypeEnhanceMapKey as keyof typeof outputTypesEnhanceMap;
    const typeConfig = outputTypesEnhanceMap[outputTypeName]!;
    const typeClass = outputTypes[outputTypeName];
    const typeTarget = typeClass.prototype;
    applyTypeClassEnhanceConfig(
      typeConfig,
      typeClass,
      typeTarget,
      outputsInfo[outputTypeName as keyof typeof outputsInfo],
    );
  }
}

const inputsInfo = {
  BlockWhereInput: ["AND", "OR", "NOT", "height"],
  BlockOrderByWithRelationInput: ["height"],
  BlockWhereUniqueInput: ["height", "AND", "OR", "NOT"],
  BlockOrderByWithAggregationInput: ["height", "_count", "_avg", "_max", "_min", "_sum"],
  BlockScalarWhereWithAggregatesInput: ["AND", "OR", "NOT", "height"],
  BalanceWhereInput: ["AND", "OR", "NOT", "height", "address", "amount"],
  BalanceOrderByWithRelationInput: ["height", "address", "amount"],
  BalanceWhereUniqueInput: ["height_address", "AND", "OR", "NOT", "height", "address", "amount"],
  BalanceOrderByWithAggregationInput: ["height", "address", "amount", "_count", "_avg", "_max", "_min", "_sum"],
  BalanceScalarWhereWithAggregatesInput: ["AND", "OR", "NOT", "height", "address", "amount"],
  BlockCreateInput: ["height"],
  BlockUpdateInput: ["height"],
  BlockCreateManyInput: ["height"],
  BlockUpdateManyMutationInput: ["height"],
  BalanceCreateInput: ["height", "address", "amount"],
  BalanceUpdateInput: ["height", "address", "amount"],
  BalanceCreateManyInput: ["height", "address", "amount"],
  BalanceUpdateManyMutationInput: ["height", "address", "amount"],
  IntFilter: ["equals", "in", "notIn", "lt", "lte", "gt", "gte", "not"],
  BlockCountOrderByAggregateInput: ["height"],
  BlockAvgOrderByAggregateInput: ["height"],
  BlockMaxOrderByAggregateInput: ["height"],
  BlockMinOrderByAggregateInput: ["height"],
  BlockSumOrderByAggregateInput: ["height"],
  IntWithAggregatesFilter: ["equals", "in", "notIn", "lt", "lte", "gt", "gte", "not", "_count", "_avg", "_sum", "_min", "_max"],
  StringFilter: ["equals", "in", "notIn", "lt", "lte", "gt", "gte", "contains", "startsWith", "endsWith", "mode", "not"],
  BalanceHeightAddressCompoundUniqueInput: ["height", "address"],
  BalanceCountOrderByAggregateInput: ["height", "address", "amount"],
  BalanceAvgOrderByAggregateInput: ["height"],
  BalanceMaxOrderByAggregateInput: ["height", "address", "amount"],
  BalanceMinOrderByAggregateInput: ["height", "address", "amount"],
  BalanceSumOrderByAggregateInput: ["height"],
  StringWithAggregatesFilter: ["equals", "in", "notIn", "lt", "lte", "gt", "gte", "contains", "startsWith", "endsWith", "mode", "not", "_count", "_min", "_max"],
  IntFieldUpdateOperationsInput: ["set", "increment", "decrement", "multiply", "divide"],
  StringFieldUpdateOperationsInput: ["set"],
  NestedIntFilter: ["equals", "in", "notIn", "lt", "lte", "gt", "gte", "not"],
  NestedIntWithAggregatesFilter: ["equals", "in", "notIn", "lt", "lte", "gt", "gte", "not", "_count", "_avg", "_sum", "_min", "_max"],
  NestedFloatFilter: ["equals", "in", "notIn", "lt", "lte", "gt", "gte", "not"],
  NestedStringFilter: ["equals", "in", "notIn", "lt", "lte", "gt", "gte", "contains", "startsWith", "endsWith", "not"],
  NestedStringWithAggregatesFilter: ["equals", "in", "notIn", "lt", "lte", "gt", "gte", "contains", "startsWith", "endsWith", "not", "_count", "_min", "_max"]
};

type InputTypesNames = keyof typeof inputTypes;

type InputTypeFieldNames<TInput extends InputTypesNames> = Exclude<
  keyof typeof inputTypes[TInput]["prototype"],
  number | symbol
>;

type InputTypeFieldsConfig<
  TInput extends InputTypesNames
> = FieldsConfig<InputTypeFieldNames<TInput>>;

export type InputTypeConfig<TInput extends InputTypesNames> = {
  class?: ClassDecorator[];
  fields?: InputTypeFieldsConfig<TInput>;
};

export type InputTypesEnhanceMap = {
  [TInput in InputTypesNames]?: InputTypeConfig<TInput>;
};

export function applyInputTypesEnhanceMap(
  inputTypesEnhanceMap: InputTypesEnhanceMap,
) {
  for (const inputTypeEnhanceMapKey of Object.keys(inputTypesEnhanceMap)) {
    const inputTypeName = inputTypeEnhanceMapKey as keyof typeof inputTypesEnhanceMap;
    const typeConfig = inputTypesEnhanceMap[inputTypeName]!;
    const typeClass = inputTypes[inputTypeName];
    const typeTarget = typeClass.prototype;
    applyTypeClassEnhanceConfig(
      typeConfig,
      typeClass,
      typeTarget,
      inputsInfo[inputTypeName as keyof typeof inputsInfo],
    );
  }
}

