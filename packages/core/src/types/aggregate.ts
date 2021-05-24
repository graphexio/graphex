import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { AMObjectType, AMTypeFactory } from '../definitions';
import { defaultSelectionVisitorHandler } from './visitorHandlers';

export class AMAggregateTypeFactory extends AMTypeFactory<AMObjectType> {
  getTypeName(modelType): string {
    return `Aggregate${modelType.name}`;
  }
  getType(modelType) {
    return new AMObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          count: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: parent => parent,
            ...defaultSelectionVisitorHandler('count'),
          },
          sum: {
            type: this.configResolver.resolveType(
              modelType,
              this.links.sum
            ) as GraphQLObjectType,
            ...defaultSelectionVisitorHandler('sum'),
          },
          min: {
            type: this.configResolver.resolveType(
              modelType,
              this.links.min
            ) as GraphQLObjectType,
            ...defaultSelectionVisitorHandler('min'),
          },
          max: {
            type: this.configResolver.resolveType(
              modelType,
              this.links.max
            ) as GraphQLObjectType,
            ...defaultSelectionVisitorHandler('max'),
          },
        };

        return fields;
      },
    });
  }
}
