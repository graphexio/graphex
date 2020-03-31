import { getNamedType, GraphQLList } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  AMModelType,
  AMTypeFactory,
  IAMQuerySelector,
  IAMTypeFactory,
} from '../definitions';
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
        });

        return fields;
      },
      ...whereTypeVisitorHandler(),
    });
  }
}
