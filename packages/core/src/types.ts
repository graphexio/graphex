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
} from 'graphql';
import pipe from 'ramda/es/pipe';
import Maybe from 'graphql/tsutils/Maybe';
import { AMTransaction } from './execution/transaction';
import { AMOperation } from './execution/operations/operation';
import { AMAction } from './execution/actions/action';

export type mmTransformType = (input: {
  [fieldName: string]: any;
}) => { [fieldName: string]: any };

export type AMVisitorStack = (AMOperation | AMAction)[];

export type AMVisitableField = {
  amEnter?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
  amLeave?(node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack);
};

export type AMInputField = GraphQLInputField & {
  mmTransform: mmTransformType;
} & AMVisitableField;

export type AMInputFieldMap = {
  [key: string]: AMInputField;
};

export type AMInputObjectType = Omit<GraphQLInputObjectType, 'getFields'> & {
  getFields(): AMInputFieldMap;
};

export type AMField = GraphQLField<any, any> & AMVisitableField;

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
  getFieldFactories(field: GraphQLField<any, any>): IAMInputFieldFactory[];
}

export interface IAMInputFieldFactory {
  getFieldName(field: GraphQLField<any, any>): string;
  getField(
    field: GraphQLField<any, any>,
    schemaInfo: AMSchemaInfo
  ): AMInputField;
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
