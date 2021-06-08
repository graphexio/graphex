import {
  ASTNode,
  EnumTypeDefinitionNode,
  EnumTypeExtensionNode,
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLField,
  GraphQLInputField,
  GraphQLInputFieldConfig,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  InputObjectTypeDefinitionNode,
  InputObjectTypeExtensionNode,
  Thunk,
} from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';
import { AMConfigResolver } from './config/resolver';
import { AMTransaction } from './execution/transaction';
import { AMVisitorStack } from './execution/visitorStack';
import { AMDBExecutorOperationType } from '@graphex/mongodb-executor';
export { AMDBExecutorOperationType } from '@graphex/mongodb-executor';

export abstract class AMFactory {
  links: { [key: string]: string | string[] };
  dynamicLinks: { [key: string]: { [key: string]: string | string[] } };
  schemaInfo: AMSchemaInfo;
  configResolver: AMConfigResolver;

  constructor(options: AMFactoryOptions) {
    this.links = options.links;
    this.dynamicLinks = options.dynamicLinks;
    this.schemaInfo = options.schemaInfo;
    this.configResolver = options.configResolver;
  }

  getDynamicLinksForType(typeName: string) {
    return this.dynamicLinks[typeName]
      ? this.dynamicLinks[typeName]
      : this.dynamicLinks._default;
  }
}

export type AMOptions = {
  aclWhere?: boolean;
  config?: AMConfig;
};

export type mmTransformType = (input: {
  [fieldName: string]: any;
}) => { [fieldName: string]: any };

type AMEnterHandler = (
  node: ASTNode,
  transaction: AMTransaction,
  stack: AMVisitorStack
) => void;
type AMLeaveHandler = (
  node: ASTNode,
  transaction: AMTransaction,
  stack: AMVisitorStack
) => void;

export type AMVisitable = {
  amEnter?: AMEnterHandler;
  amLeave?: AMLeaveHandler;
};

export type AMInputField = GraphQLInputField & {
  dbName?: string;
} & AMVisitable;

export type AMInputFieldMap = {
  [key: string]: AMInputField;
};

export class AMEnumType extends GraphQLEnumType implements AMVisitable {
  amEnter?: AMEnterHandler;
  amLeave?: AMLeaveHandler;
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
  amEnter?: AMEnterHandler;
  amLeave?: AMLeaveHandler;
}

export class AMInputObjectType
  extends GraphQLInputObjectType
  implements AMVisitable {
  amEnter?: AMEnterHandler;
  amLeave?: AMLeaveHandler;
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
  amEnter?: AMEnterHandler;
  amLeave?: AMLeaveHandler;
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
  amEnter?: AMEnterHandler;
  amLeave?: AMLeaveHandler;

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

export type RelationInfo = {
  external: boolean;
  abstract: boolean;
  relationField: string;
  storeField: string;
  collection: string;
  many?: boolean; // for extRelation
};

export type AMModelField = AMField & {
  dbName: string;
  isID: boolean;
  isUnique: boolean;
  isReadOnly: boolean;
  isConnection?: boolean;
  isSubdocument?: boolean;
  relationOutside?: {
    storeField: string;
  };
  defaultValue?: any;
  relation: RelationInfo;
  nodesRelation?: boolean; // indicates that this is a relation field, but it has no relation information (Connection type)
  aggregateRelation?: boolean; // indicates that this is a relation field, but it has no relation information (Connection type)
  amMapValue?: (v: any) => any; // hack for connection type
  noArrayFilter: boolean;
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
  mmConnection: boolean;
  mmModel: boolean;
  mmModelInherited?: boolean;
  mmCreatedAtFields?: AMModelField[];
  mmUpdatedAtFields?: AMModelField[];
  mmDefaultFields?: AMModelField[];
  mmUniqueFields?: AMModelField[];
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
  isApplicable(inputType: AMModelType): boolean;
  isApplicable() {
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

export abstract class AMFieldFactory extends AMFactory {
  abstract isApplicable(field: AMModelField): boolean;
  abstract getFieldName(field: AMModelField): string;
  abstract getField(field: AMModelField): AMField;
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
  dynamicLinks: { [key: string]: { [key: string]: string | string[] } };
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
    groupBy?: string;
  };
};

export interface AMConfig {
  [typeName: string]: {
    methodFactories?: {
      [factoryKey: string]: {
        factory?: new (options: AMFactoryOptions) => AMMethodFieldFactory;
        links?: {
          [key: string]: string | string[];
        };
        dynamicLinks?: {
          [type: string]: {
            [key: string]: string | string[];
          };
        };
      };
    };
    typeFactories?: {
      [factoryKey: string]: {
        factory?: new (
          options: AMFactoryOptions
        ) => AMTypeFactory<GraphQLNamedType>;
        links?: {
          [key: string]: string | string[];
        };
        dynamicLinks?: {
          [type: string]: {
            [key: string]: string | string[];
          };
        };
      };
    };
    fieldFactories?: {
      [factoryKey: string]: {
        factory?: new (options: AMFactoryOptions) => AMFieldFactory;
        links?: {
          [key: string]: string | string[];
        };
        dynamicLinks?: {
          [type: string]: {
            [key: string]: string | string[];
          };
        };
      };
    };
    inputTypeFactories?: {
      [factoryKey: string]: {
        factory?: new (options: AMFactoryOptions) => AMInputTypeFactory;
        links?: {
          [key: string]: string | string[];
        };
        dynamicLinks?: {
          [type: string]: {
            [key: string]: string | string[];
          };
        };
      };
    };
    inputFieldFactories?: {
      [factoryKey: string]: {
        factory?: new (options: AMFactoryOptions) => AMInputFieldFactory;
        links?: {
          [key: string]: string | string[];
        };
        dynamicLinks?: {
          [type: string]: {
            [key: string]: string | string[];
          };
        };
      };
    };
  };
}
