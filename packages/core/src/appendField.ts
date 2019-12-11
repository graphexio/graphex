import { GraphQLNamedType, GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  AMModelType,
  AMResolveFactoryType,
  IAMModelQueryFieldFactory,
  IAMTypeFactory,
} from './definitions';

export default function(
  schema: GraphQLSchema,
  targetType: GraphQLObjectType,
  fieldFactory: IAMModelQueryFieldFactory,
  modelType: AMModelType
) {
  const resolveType = (typeName: string) => {
    return schema.getType(typeName);
  };

  const resolveFactoryType: AMResolveFactoryType = <T extends GraphQLNamedType>(
    modelType: AMModelType,
    typeFactory: IAMTypeFactory<T>
  ) => {
    const typeName = typeFactory.getTypeName(modelType);
    let type = schema.getType(typeName) as T;
    if (!type) {
      type = typeFactory.getType(modelType, {
        schema,
        resolveType,
        resolveFactoryType,
      });
      schema.getTypeMap()[typeName] = type;
    }
    return type;
  };

  const fieldName = fieldFactory.getFieldName(modelType);
  targetType.getFields()[fieldName] = fieldFactory.getField(modelType, {
    schema,
    resolveType,
    resolveFactoryType,
  });
}
