import { GraphQLField, GraphQLInputObjectType, GraphQLList } from 'graphql';
import {
  IAMQuerySelector,
  AMInputObjectType,
  IAMTypeFactory,
  AMInputFieldConfigMap,
  AMModelField,
} from '../types';
import { Selectors } from './querySelectors';
import { AMSelectorContext } from '../execution/contexts/selector';
import R from 'ramda';
import { AMOperation } from '../execution/operation';
import { AMListValueContext } from '../execution/contexts/listValue';
import last from 'ramda/es/last';
import {
  whereTypeVisitorHandler,
  defaultObjectFieldVisitorHandler,
} from './visitorHandlers';

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
          const fieldFactories = Selectors.filter(isApplicable(field)).map(
            selectorToFieldFactory
          );

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
