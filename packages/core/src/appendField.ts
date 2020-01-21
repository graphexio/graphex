import { GraphQLNamedType, GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  AMModelType,
  AMResolveFactoryType,
  IAMFieldFactory,
  IAMTypeFactory,
  AMOptions,
} from './definitions';
import { makeSchemaInfo } from './schemaInfo';

export default function(
  schema: GraphQLSchema,
  targetType: GraphQLObjectType,
  fieldFactory: IAMFieldFactory,
  modelType: AMModelType,
  options: AMOptions
) {
  const schemaInfo = makeSchemaInfo(schema, options);
  const fieldName = fieldFactory.getFieldName(modelType);
  targetType.getFields()[fieldName] = fieldFactory.getField(
    modelType,
    schemaInfo
  );
}
