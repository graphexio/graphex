import { GraphQLList, GraphQLInputFieldConfig } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  IAMQuerySelector,
  IAMTypeFactory,
} from '../definitions';
import { getSelectors } from './querySelectors';
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

export const AMWhereTypeFactory: IAMTypeFactory<AMInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}WhereInput`;
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

        fields.AND = {
          type: new GraphQLList(
            schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory)
          ),
          ...defaultObjectFieldVisitorHandler('$and'),
        };
        fields.OR = {
          type: new GraphQLList(
            schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory)
          ),
          ...defaultObjectFieldVisitorHandler('$or'),
        };

        Object.values(modelType.getFields()).forEach(field => {
          const fieldFactories = field?.mmFieldFactories?.AMWhereTypeFactory
            ? field.mmFieldFactories.AMWhereTypeFactory
            : getSelectors()
                .filter(isApplicable(field))
                .map(selectorToFieldFactory);

          fieldFactories.forEach(factory => {
            const fieldName = factory.getFieldName(field);
            fields[fieldName] = factory.getField(field, schemaInfo);
          });
        });

        return fields;
      },
      ...whereTypeVisitorHandler,
    });
  },
};
