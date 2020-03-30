import {
  GraphQLInputFieldConfig,
  GraphQLInputObjectType,
  getNamedType,
  isInterfaceType,
} from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  IAMQuerySelector,
  IAMTypeFactory,
  AMTypeFactory,
  AMModelType,
} from '../definitions';
import { AsIsSelector } from './querySelectors/asis';
import {
  defaultObjectFieldVisitorHandler,
  whereTypeVisitorHandler,
} from './visitorHandlers';
import { AMWhereACLTypeFactory } from './whereACL';

const isApplicable = (field: AMModelField) => (selector: IAMQuerySelector) =>
  selector.isApplicable(field);

const selectorToFieldFactory = (selector: IAMQuerySelector) => {
  return selector.getFieldFactory();
};

export class AMWhereUniqueTypeFactory extends AMTypeFactory<AMInputObjectType> {
  isApplicable(type: AMModelType) {
    return !isInterfaceType(type);
  }
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}WhereUniqueInput`;
  }
  getType(modelType: AMModelType) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{};

        if (this.schemaInfo.options.aclWhere) {
          fields.aclWhere = <GraphQLInputFieldConfig>{
            type: this.configResolver.resolveInputType(
              modelType,
              this.links.whereACL
            ),
            ...defaultObjectFieldVisitorHandler('aclWhere'),
          };
        }

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
