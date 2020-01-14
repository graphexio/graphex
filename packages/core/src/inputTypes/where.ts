import { GraphQLList } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  IAMQuerySelector,
  IAMTypeFactory,
} from '../definitions';
import { Selectors } from './querySelectors';
import {
  defaultObjectFieldVisitorHandler,
  whereTypeVisitorHandler,
} from './visitorHandlers';

const isApplicable = (field: AMModelField) => (selector: IAMQuerySelector) =>
  selector.isApplicable(field);

const selectorToFieldFactory = (selector: IAMQuerySelector) => {
  return selector.getFieldFactory();
};

export const AMWhereTypeFactory: IAMTypeFactory<AMInputObjectType> = {
  getTypeName(modelType): string {
    if (`${modelType.name}WhereInput` === 'CategoryConnectionWhereInput') {
      throw new Error('Aggregate error');
    }
    return `${modelType.name}WhereInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          AND: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory)
            ),
            ...defaultObjectFieldVisitorHandler('$and'),
          },
          OR: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory)
            ),
            ...defaultObjectFieldVisitorHandler('$or'),
          },
        };

        Object.values(modelType.getFields()).forEach(field => {
          const fieldFactories = field?.mmFieldFactories?.AMCreateTypeFactory
            ? field.mmFieldFactories.AMWhereTypeFactory
            : Selectors.filter(isApplicable(field)).map(selectorToFieldFactory);

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
