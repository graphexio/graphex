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
import { GraphQLInt, GraphQLNonNull } from 'graphql';

export const AMAggregateTypeFactory: IAMTypeFactory<AMObjectType> = {
  getTypeName(modelType): string {
    return `Aggregate${modelType.name}`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          count: {
            type: new GraphQLNonNull(GraphQLInt),
          },
        };

        return fields;
      },
    });
  },
};
