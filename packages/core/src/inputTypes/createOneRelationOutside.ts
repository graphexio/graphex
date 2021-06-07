import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';

export class AMCreateOneRelationOutsideTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateOneRelationOutsideInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        return {
          connect: {
            type: this.configResolver.resolveInputType(modelType, [
              'whereUniqueExternal',
              'interfaceWhereUniqueExternal',
            ]),
          },
        } as AMInputFieldConfigMap;
      },
    });
  }
}
