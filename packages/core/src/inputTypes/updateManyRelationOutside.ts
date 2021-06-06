import { GraphQLList } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';

export class AMUpdateManyRelationOutsideTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateManyRelationOutsideInput`;
  }

  getType(modelType: AMModelType) {
    const typeName = this.getTypeName(modelType);

    return new AMInputObjectType({
      name: typeName,
      fields: () => {
        return {
          connect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
          },
          reconnect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
          },
          disconnect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
          },
        } as AMInputFieldConfigMap;
      },
    });
  }
}
