import {
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLList,
  getNamedType,
  isCompositeType,
} from 'graphql';
import {
  IAMQuerySelector,
  IAMTypeFactory,
  AMInputObjectType,
  AMModelField,
} from '../definitions';
import { AsIsSelector } from './querySelectors/asis';
import { whereTypeVisitorHandler } from './visitorHandlers';

const isApplicable = (field: AMModelField) => (selector: IAMQuerySelector) =>
  selector.isApplicable(field);

const selectorToFieldFactory = (selector: IAMQuerySelector) => {
  return selector.getFieldFactory();
};

export const AMWhereUniqueTypeFactory: IAMTypeFactory<GraphQLInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}WhereUniqueInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};

        Object.values(modelType.getFields()).forEach(field => {
          if (field.isUnique) {
            const fieldFactories = field?.mmFieldFactories
              ?.AMWhereUniqueTypeFactory
              ? field.mmFieldFactories.AMWhereUniqueTypeFactory
              : [AsIsSelector]
                  .filter(isApplicable(field))
                  .map(selectorToFieldFactory);

            fieldFactories.forEach(factory => {
              const fieldName = factory.getFieldName(field);
              fields[fieldName] = factory.getField(field, schemaInfo);
            });
          }
        });

        return fields;
      },
      ...whereTypeVisitorHandler,
    });
  },
};
