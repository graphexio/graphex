import { GraphQLScalarType } from 'graphql';
import { IAMTypeFactory } from '../../definitions';

export const AMFederationAnyTypeFactory: IAMTypeFactory<GraphQLScalarType> = {
  getTypeName() {
    return `_Any`;
  },
  getType() {
    return new GraphQLScalarType({
      name: '_Any',
      serialize(value) {
        return value;
      },
    });
  },
};
