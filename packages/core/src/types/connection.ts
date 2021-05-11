import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import { AMObjectType, AMTypeFactory } from '../definitions';
import { defaultSelectionVisitorHandler } from './visitorHandlers';

export class AMConnectionTypeFactory extends AMTypeFactory<AMObjectType> {
  getTypeName(modelType): string {
    return `${modelType.name}Connection`;
  }
  getType(modelType) {
    return new AMObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          nodes: {
            type: new GraphQLNonNull(
              new GraphQLList(new GraphQLNonNull(modelType))
            ),
          },
          totalCount: {
            type: GraphQLInt,
          },
          aggregate: {
            type: this.configResolver.resolveType(
              modelType,
              'aggregate'
            ) as GraphQLObjectType,
            ...defaultSelectionVisitorHandler('aggregate'),
          },
        };

        return fields;
      },
    });
  }
}
