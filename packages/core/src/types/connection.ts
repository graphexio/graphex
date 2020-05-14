import { GraphQLObjectType } from 'graphql';
import { AMObjectType, AMTypeFactory } from '../definitions';
import { AMFieldsSelectionContext } from '../execution';
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
