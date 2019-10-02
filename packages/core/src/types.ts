import {
  GraphQLInputField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLType,
  GraphQLField,
  GraphQLNamedType,
  GraphQLInputObjectType,
  GraphQLFieldMap,
  GraphQLSchema,
  ASTNode,
  Thunk,
  GraphQLInputFieldConfigMap,
  InputObjectTypeDefinitionNode,
  InputObjectTypeExtensionNode,
} from 'graphql';
import pipe from 'ramda/es/pipe';
import Maybe from 'graphql/tsutils/Maybe';
import { AMTransaction } from './execution/transaction';
import { AMOperation } from './execution/operation';
import { AMContext } from './execution/context';

export type mmTransformType = (input: {
  [fieldName: string]: any;
}) => { [fieldName: string]: any };

export type AMVisitorStack = AMContext[];

export type AMVisitable = {
  amEnter?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
  amLeave?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
};

export type AMInputField = GraphQLInputField & {
  mmTransform: mmTransformType;
} & AMVisitable;

export type AMInputFieldMap = {
  [key: string]: AMInputField;
};

export class AMInputObjectType extends GraphQLInputObjectType
  implements AMVisitable {
  amEnter?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
  amLeave?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
  getFields(): AMInputFieldMap {
    return super.getFields() as AMInputFieldMap;
  }
  constructor(config: AMInputObjectTypeConfig) {
    super(config);
    this.amEnter = config.amEnter;
    this.amLeave = config.amLeave;
  }
}

export interface AMInputObjectTypeConfig {
  name: string;
  fields: Thunk<GraphQLInputFieldConfigMap>;
  description?: Maybe<string>;
  astNode?: Maybe<InputObjectTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<InputObjectTypeExtensionNode>>;
  amEnter?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
  amLeave?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
}

export type AMField = GraphQLField<any, any> & AMVisitable;

export type AMFieldMap = {
  [key: string]: AMField;
};

export type AMObjectType = Omit<GraphQLObjectType, 'getFields'> & {
  getFields(): AMFieldMap;
};

export type AMInterfaceType = Omit<GraphQLInterfaceType, 'getFields'> & {
  getFields(): AMFieldMap;
};

export type AMModelField = AMField & {
  dbName: string;
};

export type AMModelFieldMap = {
  [key: string]: AMModelField;
};
export type AMModelType = (
  | Omit<GraphQLObjectType, 'getFields'>
  | Omit<GraphQLInterfaceType, 'getFields'>) & {
  getFields(): AMModelFieldMap;
  mmCollectionName: string;
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

export interface IAMModelTypeFactory<T extends GraphQLNamedType>
  extends IAMTypeFactory<T> {
  getFieldFactories(field: AMField): IAMInputFieldFactory[];
}

export interface IAMInputFieldFactory {
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
  isApplicable(field: GraphQLField<any, any, any>): boolean;
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
