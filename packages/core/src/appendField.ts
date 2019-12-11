import { GraphQLNamedType, GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  AMModelType,
  AMResolveFactoryType,
  IAMModelQueryFieldFactory,
  IAMTypeFactory,
} from './definitions';
import { makeSchemaInfo } from './schemaInfo';

export default function(
  schema: GraphQLSchema,
  targetType: GraphQLObjectType,
  fieldFactory: IAMModelQueryFieldFactory,
  modelType: AMModelType
) {
  const schemaInfo = makeSchemaInfo(schema);
  const fieldName = fieldFactory.getFieldName(modelType);
  targetType.getFields()[fieldName] = fieldFactory.getField(
    modelType,
    schemaInfo
  );
}
