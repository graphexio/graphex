import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { AMObjectType, AMTypeFactory } from '../definitions';

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
          },
          sum: {
            type: this.configResolver.resolveType(
              modelType,
              this.links.sum
            ) as GraphQLObjectType,
          },
          min: {
            type: this.configResolver.resolveType(
              modelType,
              this.links.min
            ) as GraphQLObjectType,
          },
          max: {
            type: this.configResolver.resolveType(
              modelType,
              this.links.max
            ) as GraphQLObjectType,
          },
        };

        return fields;
      },
    });
  }
}
