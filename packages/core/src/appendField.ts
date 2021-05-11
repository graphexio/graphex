import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { AMModelType, AMOptions, IAMFieldFactory } from './definitions';
import { makeSchemaInfo } from './schemaInfo';

export const appendField = (
  schema: GraphQLSchema,
  targetType: GraphQLObjectType,
  fieldFactory: IAMFieldFactory,
  modelType: AMModelType,
  options: AMOptions
) => {
  const schemaInfo = makeSchemaInfo(schema, options);
  const fieldName = fieldFactory.getFieldName(modelType);
  targetType.getFields()[fieldName] = fieldFactory.getField(
    modelType,
    schemaInfo
  );
};
