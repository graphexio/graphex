import { GraphQLList } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  IAMQuerySelector,
  IAMTypeFactory,
  AMTypeFactory,
  AMModelType,
} from '../definitions';
import { getSelectors } from './querySelectors';
import {
  defaultObjectFieldVisitorHandler,
  whereTypeVisitorHandler,
} from './visitorHandlers';

const isApplicable = (field: AMModelField) => (selector: IAMQuerySelector) =>
  selector.isApplicable(field);

const selectorToFieldFactory = (selector: IAMQuerySelector) => {
  return selector.getFieldFactory();
};

export class AMWhereACLTypeFactory extends AMTypeFactory<AMInputObjectType> {
  isApplicable() {
    return true;
  }
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}WhereACLInput`;
  }
  getType(modelType: AMModelType) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          AND: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, this.links.and)
            ),
            ...defaultObjectFieldVisitorHandler('$and'),
          },
          OR: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, this.links.or)
            ),
            ...defaultObjectFieldVisitorHandler('$or'),
          },
        };

        Object.values(modelType.getFields()).forEach(field => {
          const fieldFactories = field?.mmFieldFactories?.AMCreateTypeFactory
            ? field.mmFieldFactories.AMWhereTypeFactory
            : getSelectors()
                .filter(isApplicable(field))
                .map(selectorToFieldFactory);

          fieldFactories.forEach(factory => {
            const fieldName = factory.getFieldName(field);
            fields[fieldName] = factory.getField(field, this.schemaInfo);
          });
        });

        return fields;
      },
      ...whereTypeVisitorHandler(),
    });
  }
}
