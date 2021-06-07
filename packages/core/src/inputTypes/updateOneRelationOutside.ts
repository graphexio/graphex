import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';

export class AMUpdateOneRelationOutsideTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateOneRelationOutsideInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        return {
          connect: {
            type: this.configResolver.resolveInputType(modelType, [
              'whereUniqueExternal',
              'interfaceWhereUnique',
            ]),
          },
        } as AMInputFieldConfigMap;
      },
    });
  }
}
