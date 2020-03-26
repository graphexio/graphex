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
  GraphQLOutputType,
  GraphQLObjectTypeConfig,
  GraphQLArgument,
  GraphQLScalarType,
} from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';
import { AMContext } from './execution/context';
import { AMTransaction } from './execution/transaction';
import { AMConfigResolver } from './config/resolver';

export abstract class AMFactory {
  links: { [key: string]: string | string[] };
  schemaInfo: AMSchemaInfo;
  configResolver: AMConfigResolver;

  constructor(options: AMFactoryOptions) {
    this.links = options.links;
    this.schemaInfo = options.schemaInfo;
    this.configResolver = options.configResolver;
  }
}

export type AMOptions = {
  aclWhere?: boolean;
};

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

export type AMField = Omit<GraphQLField<any, any>, 'type' | 'args'> &
  AMVisitable & {
    type:
      | Exclude<GraphQLOutputType, GraphQLObjectType | GraphQLInterfaceType>
      | AMObjectType
      | AMModelType;
    args: AMArgumet[];
    mmFieldFactories?: { [typeFactoryName: string]: IAMInputFieldFactory[] };
  };

export type AMFieldMap = {
  [key: string]: AMField;
};

export class AMObjectType extends GraphQLObjectType implements AMVisitable {
  mmDiscriminator: string;
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

  constructor(config: AMObjectTypeConfig) {
    super(config);
    this.amEnter = config.amEnter;
    this.amLeave = config.amLeave;
  }

  getFields(): AMFieldMap {
    return super.getFields() as AMFieldMap;
  }
}
export type AMObjectTypeConfig = GraphQLObjectTypeConfig<any, any, any> &
  AMVisitable;

export type AMInterfaceType = Omit<GraphQLInterfaceType, 'getFields'> & {
  getFields(): AMFieldMap;
  mmDiscriminatorMap: { [key: string]: string };
};

export type AMModelField = AMField & {
  dbName: string;
  isID: boolean;
  isUnique: boolean;
  isReadOnly: boolean;
  defaultValue?: any;
  relation: {
    external: boolean;
    abstract: boolean;
    relationField: string;
    storeField: string;
    collection: string;
  };
};

export type AMModelFieldMap = {
  [key: string]: AMModelField;
};
export type AMModelType = (
  | Omit<AMObjectType, 'getFields'>
  | Omit<AMInterfaceType, 'getFields'>
) & {
  getFields(): AMModelFieldMap;
  mmCollectionName: string;
  mmDiscriminator: string;
  mmDiscriminatorField: string;
  mmAbstract: boolean;
  mmEmbedded: boolean;
  mmModel: boolean;
  mmCreatedAtFields?: AMModelField[];
  mmUpdatedAtFields?: AMModelField[];
  mmDefaultFields?: AMModelField[];
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
  options: AMOptions;
}

export interface IAMTypeFactory<T extends GraphQLNamedType> {
  getTypeName(inputType: GraphQLNamedType): string;
  getType(inputType: AMModelType, schemaInfo: AMSchemaInfo): T;
}

export abstract class AMTypeFactory<
  T extends GraphQLNamedType
> extends AMFactory {
  isApplicable(inputType: AMModelType) {
    return true;
  }
  abstract getTypeName(inputType: GraphQLNamedType): string;
  abstract getType(inputType: AMModelType, schemaInfo: AMSchemaInfo): T;
}

export abstract class AMInputTypeFactory extends AMTypeFactory<
  GraphQLInputObjectType | GraphQLEnumType | GraphQLScalarType
> {}

// export interface IAMModelTypeFactory<T extends GraphQLNamedType>
//   extends IAMTypeFactory<T> {
//   getFieldFactories(field: AMField): IAMInputFieldFactory[];
// }

export interface IAMInputFieldFactory {
  isApplicable(field: AMModelField): boolean;
  getFieldName(field: AMModelField): string;
  getField(field: AMModelField, schemaInfo: AMSchemaInfo): AMInputField;
}

export abstract class AMInputFieldFactory extends AMFactory {
  abstract isApplicable(field: AMModelField): boolean;
  abstract getFieldName(field: AMModelField): string;
  abstract getField(field: AMModelField): AMInputField;
}

export interface IAMFieldFactory {
  getFieldName(inputType: AMModelType): string;
  getField(
    inputType: AMModelType,
    schemaInfo: AMSchemaInfo
  ): GraphQLField<any, any>;
}

export enum GraphQLOperationType {
  Query,
  Mutation,
}

export interface IAMMethodFieldFactory {
  getOperationType(): GraphQLOperationType;
  getFieldName(inputType: AMModelType): string;
  getField(
    inputType: AMModelType,
    schemaInfo: AMSchemaInfo
  ): GraphQLField<any, any>;
}

type AMFactoryOptions = {
  links: { [key: string]: string | string[] };
  schemaInfo: AMSchemaInfo;
  configResolver: AMConfigResolver;
};

export abstract class AMMethodFieldFactory extends AMFactory {
  abstract getOperationType(): GraphQLOperationType;
  abstract getFieldName(type: AMModelType): string;
  abstract getField(type: AMModelType): GraphQLField<any, any>;
}

export interface IAMQuerySelector {
  isApplicable(field: AMModelField): boolean;
  getFieldFactory(): IAMInputFieldFactory;
}

export type AMArgumet = GraphQLArgument & AMVisitable;

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
    limit?: number;
    skip?: number;
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

export interface AMConfig {
  [typeName: string]: {
    methodFactories?: {
      [factoryKey: string]: {
        factory: new (options: AMFactoryOptions) => AMMethodFieldFactory;
        links?: {
          [key: string]: string | string[];
        };
      };
    };
    typeFactories?: {
      [factoryKey: string]: {
        factory: new (options: AMFactoryOptions) => AMTypeFactory<
          GraphQLNamedType
        >;
        links?: {
          [key: string]: string | string[];
        };
      };
    };
    inputTypeFactories?: {
      [factoryKey: string]: {
        factory: new (options: AMFactoryOptions) => AMInputTypeFactory;
        links?: {
          [key: string]: string | string[];
        };
      };
    };
    inputFieldFactories?: {
      [factoryKey: string]: {
        factory: new (options: AMFactoryOptions) => AMInputFieldFactory;
        links?: {
          [key: string]: string | string[];
        };
      };
    };
  };
}
