import R from 'ramda';
import { AMDataContext } from '../execution/contexts/data';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMOperation } from '../execution/operation';
import {
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
  AMObjectType,
} from '../definitions';
import { GraphQLInt } from 'graphql';
import { AMAggregateTypeFactory } from './aggregate';

export const AMConnectionTypeFactory: IAMTypeFactory<AMObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}Connection`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          aggregate: {
            type: schemaInfo.resolveFactoryType(
              modelType,
              AMAggregateTypeFactory
            ),
          },
        };

        return fields;
      },
    });
  },
};
