import {
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLList,
  getNamedType,
  isCompositeType,
} from 'graphql';
import { IAMModelTypeFactory, IAMQuerySelector } from '../types';
import { Selectors } from './querySelectors';
import { AsIsSelector } from './querySelectors/asis';

const isApplicable = (field: GraphQLField<any, any, any>) => (
  selector: IAMQuerySelector
) => selector.isApplicable(field);

const selectorToFieldFactory = (selector: IAMQuerySelector) => {
  return selector.getFieldFactory();
};

export const AMWhereCleanTypeFactory: IAMModelTypeFactory<
  GraphQLInputObjectType
> = {
  getTypeName(modelType): string {
    return `${modelType.name}WhereCleanInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMModelTypeFactory<GraphQLInputObjectType> = this;
    return new GraphQLInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};

        Object.values(modelType.getFields()).forEach(field => {
          const fieldFactories = this.getFieldFactories(field);
          fieldFactories.forEach(factory => {
            const fieldName = factory.getFieldName(field);
            fields[fieldName] = factory.getField(field, schemaInfo);
          });
        });

        return fields;
      },
    });
  },
  getFieldFactories(field) {
    return [AsIsSelector]
      .filter(isApplicable(field))
      .map(selectorToFieldFactory);
  },
};
