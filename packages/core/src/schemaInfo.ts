import { GraphQLSchema, GraphQLNamedType } from 'graphql';
import {
  AMSchemaInfo,
  AMResolveFactoryType,
  AMModelType,
  IAMTypeFactory,
  AMOptions,
} from './definitions';

export const makeSchemaInfo = (
  schema: GraphQLSchema,
  options?: AMOptions
): AMSchemaInfo => {
  const resolveType = (typeName: string) => {
    return schema.getType(typeName);
  };

  const resolveFactoryType: AMResolveFactoryType = <T extends GraphQLNamedType>(
    inputType: AMModelType,
    typeFactory: IAMTypeFactory<T>
  ) => {
    const typeName = typeFactory.getTypeName(inputType);
    let type = schema.getType(typeName) as T;
    if (!type) {
      type = typeFactory.getType(inputType, {
        schema,
        resolveType,
        resolveFactoryType,
        options: options ? options : {},
      });
      schema.getTypeMap()[typeName] = type;
    }
    return type;
  };

  return {
    schema,
    resolveType,
    resolveFactoryType,
    options: options ? options : {},
  };
};
