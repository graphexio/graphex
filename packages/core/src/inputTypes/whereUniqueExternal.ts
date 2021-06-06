import { getNamedType, isInterfaceType } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';
import { whereTypeVisitorHandler } from './visitorHandlers';

export class AMWhereUniqueExternalTypeFactory extends AMTypeFactory<AMInputObjectType> {
  isApplicable(type: AMModelType) {
    return !isInterfaceType(type);
  }
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}WhereUniqueExternalInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields: AMInputFieldConfigMap = {};

        Object.values(modelType.getFields()).forEach(field => {
          if (field.isUnique) {
            const fieldType = getNamedType(field.type) as AMModelType;
            let links = this.getDynamicLinksForType(fieldType.name).selectors;
            if (!Array.isArray(links)) links = [links];

            const fieldFactories = this.configResolver
              .resolveInputFieldFactories(fieldType, links)
              .filter(factory => factory.isApplicable(field));

            fieldFactories.forEach(factory => {
              const fieldName = factory.getFieldName(field);
              fields[fieldName] = factory.getField(field);
            });
          }
        });

        return fields;
      },
      ...whereTypeVisitorHandler({ emptyAllowed: false }),
    });
  }
}
