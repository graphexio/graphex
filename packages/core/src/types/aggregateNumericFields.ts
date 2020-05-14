import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
  isObjectType,
  getNamedType,
  isListType,
} from 'graphql';
import { AMObjectType, AMTypeFactory, AMModelType } from '../definitions';
import * as R from 'ramda';
import { AMFieldsSelectionContext } from '../execution';
import { defaultSelectionVisitorHandler } from './visitorHandlers';

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
            if (isListType(field.type)) {
              return acc;
            }
            const type = getNamedType(field.type);
            let newField;
            if (type === GraphQLInt || type === GraphQLFloat) {
              newField = {
                [field.name]: {
                  type,
                  ...defaultSelectionVisitorHandler(field.dbName),
                },
              };
            } else if (isObjectType(type) && (type as AMModelType).mmEmbedded) {
              newField = {
                [field.name]: {
                  type: this.configResolver.resolveType(
                    type as AMModelType,
                    'aggregateNumericFields'
                  ) as AMObjectType,
                  ...defaultSelectionVisitorHandler(field.dbName),
                },
              };
            }
            if (newField) return { ...acc, ...newField };
            else return acc;
          },
          {}
        );
        return fields;
      },
    });
  }
}
