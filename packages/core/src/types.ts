import {
  ASTNode,
  ObjectValueNode,
  GraphQLField,
  GraphQLInputField,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLSchema,
  InputObjectTypeDefinitionNode,
  InputObjectTypeExtensionNode,
  InputValueDefinitionNode,
  Thunk,
  GraphQLFieldConfig,
  GraphQLInputFieldConfig,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  EnumTypeDefinitionNode,
  EnumTypeExtensionNode,
} from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';
import { AMContext } from './execution/context';
import { AMTransaction } from './execution/transaction';

export type mmTransformType = (input: {
  [fieldName: string]: any;
}) => { [fieldName: string]: any };

export type AMVisitorStack = AMContext[];

export type AMVisitable = {
  amEnter?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
  amLeave?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
};

export type AMInputField = GraphQLInputField & {
  // mmTransform: mmTransformType;
} & AMVisitable;

export type AMInputFieldMap = {
  [key: string]: AMInputField;
};

export class AMEnumType extends GraphQLEnumType {
  amEnter?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
  amLeave?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
  constructor(config: AMEnumTypeConfig) {
    super(config);
    this.amEnter = config.amEnter;
    this.amLeave = config.amLeave;
  }
}

export interface AMEnumTypeConfig {
  name: string;
  values: GraphQLEnumValueConfigMap;
  description?: Maybe<string>;
  astNode?: Maybe<EnumTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<EnumTypeExtensionNode>>;
  amEnter?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
  amLeave?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
}

export class AMInputObjectType extends GraphQLInputObjectType
  implements AMVisitable {
  amEnter?(
    node: ObjectValueNode,
    transaction: AMTransaction,
    stack: AMVisitorStack
  );
  amLeave?(
    node: ObjectValueNode,
    transaction: AMTransaction,
    stack: AMVisitorStack
  );
  getFields(): AMInputFieldMap {
    return super.getFields() as AMInputFieldMap;
  }
  constructor(config: AMInputObjectTypeConfig) {
    super(config);
    this.amEnter = config.amEnter;
    this.amLeave = config.amLeave;
  }
}

export type AMInputFieldConfig = GraphQLInputFieldConfig & AMVisitable;

export type AMInputFieldConfigMap = {
  [key: string]: AMInputFieldConfig;
};

export interface AMInputObjectTypeConfig {
  name: string;
  fields: Thunk<AMInputFieldConfigMap>;
  description?: Maybe<string>;
  astNode?: Maybe<InputObjectTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<InputObjectTypeExtensionNode>>;
  amEnter?(
    node: ObjectValueNode,
    transaction: AMTransaction,
    stack: AMVisitorStack
  );
  amLeave?(
    node: ObjectValueNode,
    transaction: AMTransaction,
    stack: AMVisitorStack
  );
}

export type AMField = GraphQLField<any, any> & AMVisitable;

export type AMFieldMap = {
  [key: string]: AMField;
};

export type AMObjectType = Omit<GraphQLObjectType, 'getFields'> & {
  getFields(): AMFieldMap;
  mmDiscriminator: string;
};

export type AMInterfaceType = Omit<GraphQLInterfaceType, 'getFields'> & {
  getFields(): AMFieldMap;
};

export type AMModelField = AMField & {
  dbName: string;
  isID: boolean;
  isUnique: boolean;
  relation: {
    external: boolean;
    abstract: boolean;
    relationField: string;
    storeField: string;
    collection: string;
  };
  mmFieldFactories?: { [typeFactoryName: string]: IAMInputFieldFactory[] };
};

export type AMModelFieldMap = {
  [key: string]: AMModelField;
};
export type AMModelType = (
  | Omit<AMObjectType, 'getFields'>
  | Omit<AMInterfaceType, 'getFields'>) & {
  getFields(): AMModelFieldMap;
  mmCollectionName: string;
  mmDiscriminator: string;
  mmDiscriminatorField: string;
  mmAbstract: boolean;
  mmEmbedded: boolean;
  mmCreatedAtFields?: AMModelField[];
  mmUpdatedAtFields?: AMModelField[];
};

export interface AMResolveFactoryType {
  <T extends GraphQLNamedType>(
    inputType: GraphQLNamedType,
    typeFactory: IAMTypeFactory<T>
  ): T;
}

export interface AMSchemaInfo {
  schema: GraphQLSchema;
  resolveType(typeName: string): GraphQLNamedType;
  resolveFactoryType: AMResolveFactoryType;
}

export interface IAMTypeFactory<T extends GraphQLNamedType> {
  getTypeName(inputType: GraphQLNamedType): string;
  getType(inputType: AMModelType, schemaInfo: AMSchemaInfo): T;
}

// export interface IAMModelTypeFactory<T extends GraphQLNamedType>
//   extends IAMTypeFactory<T> {
//   getFieldFactories(field: AMField): IAMInputFieldFactory[];
// }

export interface IAMInputFieldFactory {
  isApplicable(field: AMModelField): boolean;
  getFieldName(field: AMModelField): string;
  getField(field: AMModelField, schemaInfo: AMSchemaInfo): AMInputField;
}

export interface IAMModelQueryFieldFactory {
  getFieldName(modelType: AMModelType): string;
  getField(
    inputType: AMModelType,
    schemaInfo: AMSchemaInfo
  ): GraphQLField<any, any>;
}

export interface IAMQuerySelector {
  isApplicable(field: AMModelField): boolean;
  getFieldFactory(): IAMInputFieldFactory;
}

export type AMObjectFieldValueType =
  | boolean
  | string
  | number
  | { [key: string]: any };

export type AMDBExecutor = (params: AMDBExecutorParams) => Promise<any>;
export type AMDBExecutorParams = {
  type: AMDBExecutorOperationType;
  collection: string;
  doc?: { [key: string]: any };
  docs?: [{ [key: string]: any }];
  selector?: { [key: string]: any };
  fields?: string[];
  options?: {
    arrayFilters?: { [key: string]: any }[];
    sort?: { [key: string]: number };
  };
};

export enum AMDBExecutorOperationType {
  FIND = 'find',
  FIND_ONE = 'findOne',
  FIND_IDS = 'findIds',
  COUNT = 'count',
  DISTINCT = 'distinct',
  INSERT_ONE = 'insertOne',
  INSERT_MANY = 'insertMany',
  DELETE_ONE = 'deleteOne',
  DELETE_MANY = 'deleteMany',
  UPDATE_ONE = 'updateOne',
  UPDATE_MANY = 'updateMany',
}
