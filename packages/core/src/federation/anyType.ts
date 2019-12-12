import { GraphQLScalarType } from 'graphql';
import { IAMTypeFactory } from '../definitions';

export const AMFederationAnyTypeFactory: IAMTypeFactory<GraphQLScalarType> = {
  getTypeName(modelType): string {
    return `_Any`;
  },
  getType(modelType, schemaInfo) {
    return new GraphQLScalarType({
      name: '_Any',
      serialize(value) {
        return value;
      },
    });
  },
};
