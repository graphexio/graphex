import { GraphQLObjectType } from 'graphql';
import { AMObjectType, AMTypeFactory } from '../definitions';

export class AMConnectionTypeFactory extends AMTypeFactory<AMObjectType> {
  getTypeName(modelType): string {
    return `${modelType.name}Connection`;
  }
  getType(modelType) {
    return new AMObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          aggregate: {
            type: this.configResolver.resolveType(
              modelType,
              'aggregate'
            ) as GraphQLObjectType,
          },
        };

        return fields;
      },
    });
  }
}
