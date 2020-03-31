import { AMObjectType, AMTypeFactory } from '../definitions';
import { AMAggregateTypeFactory } from './aggregate';

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
            type: this.configResolver.resolveType(modelType, 'aggregate'),
          },
        };

        return fields;
      },
    });
  }
}
