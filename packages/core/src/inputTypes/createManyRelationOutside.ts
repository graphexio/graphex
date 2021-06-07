import { GraphQLInputObjectType, GraphQLList } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMModelType,
  AMTypeFactory,
} from '../definitions';

export class AMCreateManyRelationOutsideTypeFactory extends AMTypeFactory<GraphQLInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateManyRelationOutsideInput`;
  }
  getType(modelType: AMModelType) {
    return new GraphQLInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          connect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUniqueExternal',
                'interfaceWhereUniqueExternal',
              ])
            ),
          },
        } as AMInputFieldConfigMap;

        return fields;
      },
    });
  }
}
