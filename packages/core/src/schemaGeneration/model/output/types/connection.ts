import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import {
  AMModelType,
  AMObjectType,
  AMTypeFactory,
} from '../../../../definitions';

export class AMConnectionTypeFactory extends AMTypeFactory<AMObjectType> {
  getTypeName(modelType): string {
    return `${modelType.name}Connection`;
  }
  getType(modelType) {
    const type = new AMObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          nodes: {
            type: new GraphQLNonNull(
              new GraphQLList(new GraphQLNonNull(modelType))
            ),
            nodesRelation: true,
          },
          totalCount: {
            type: GraphQLInt,
            aggregateRelation: true,
          },
          aggregate: {
            type: this.configResolver.resolveType(
              modelType,
              'aggregate'
            ) as GraphQLObjectType,
            aggregateRelation: true,
          },
        };

        return fields;
      },
    });
    (type as AMModelType).mmConnection = true;

    return type;
  }
}
