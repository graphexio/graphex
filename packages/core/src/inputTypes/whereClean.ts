import { GraphQLInputFieldConfig, GraphQLInputObjectType } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  IAMQuerySelector,
  IAMTypeFactory,
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

export const AMWhereCleanTypeFactory: IAMTypeFactory<GraphQLInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}WhereCleanInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{};

        if (schemaInfo.options.aclWhere) {
          fields.aclWhere = <GraphQLInputFieldConfig>{
            type: schemaInfo.resolveFactoryType(
              modelType,
              AMWhereACLTypeFactory
            ),
            ...defaultObjectFieldVisitorHandler('aclWhere'),
          };
        }

        try {
          Object.values(modelType.getFields()).forEach(field => {
            const fieldFactories = field?.mmFieldFactories
              ?.AMWhereCleanTypeFactory
              ? field.mmFieldFactories.AMWhereCleanTypeFactory
              : [AsIsSelector]
                  .filter(isApplicable(field))
                  .map(selectorToFieldFactory);

            fieldFactories.forEach(factory => {
              const fieldName = factory.getFieldName(field);
              fields[fieldName] = factory.getField(field, schemaInfo);
            });
          });
        } catch (err) {
          throw err;
        }

        return fields;
      },
      ...whereTypeVisitorHandler,
    });
  },
};
