import { GraphQLInt, GraphQLNonNull } from 'graphql';
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
        };

        return fields;
      },
    });
  }
}
