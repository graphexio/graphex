import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
  isObjectType,
} from 'graphql';
import { AMObjectType, AMTypeFactory, AMModelType } from '../definitions';
import * as R from 'ramda';

export class AMAggregateNumericFieldsTypeFactory extends AMTypeFactory<
  AMObjectType
> {
  getTypeName(modelType: AMModelType): string {
    const name = `AggregateNumericFieldsIn${modelType.name}`;
    return name;
  }
  getType(modelType: AMModelType) {
    return new AMObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = Object.values(modelType.getFields()).reduce(
          (acc, field) => {
            if (field.type === GraphQLInt || field.type === GraphQLFloat) {
              return { ...acc, [field.name]: { type: field.type } };
            } else if (
              isObjectType(field.type) &&
              (field.type as AMModelType).mmEmbedded
            ) {
              return {
                ...acc,
                [field.name]: {
                  type: this.configResolver.resolveType(
                    field.type as AMModelType,
                    'aggregateNumericFields'
                  ) as AMObjectType,
                },
              };
            }
            return acc;
          },
          {}
        );
        return fields;
      },
    });
  }
}
