import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../definitions';

export class AMCreateOneRequiredRelationOutsideTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateOneRequiredRelationOutsideInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          connect: {
            type: this.configResolver.resolveInputType(modelType, [
              'whereUnique',
              'interfaceWhereUnique',
            ]),
          },
        } as AMInputFieldConfigMap;

        return fields;
      },
    });
  }
}
