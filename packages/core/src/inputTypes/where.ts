import { GraphQLField, GraphQLInputObjectType, GraphQLList } from 'graphql';
import { IAMModelTypeFactory, IAMQuerySelector } from '../types';
import { Selectors } from './querySelectors';

const isApplicable = (field: GraphQLField<any, any, any>) => (
  selector: IAMQuerySelector
) => selector.isApplicable(field);

const selectorToFieldFactory = (selector: IAMQuerySelector) => {
  return selector.getFieldFactory();
};

export const AMWhereTypeFactory: IAMModelTypeFactory<GraphQLInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}WhereInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMModelTypeFactory<GraphQLInputObjectType> = this;
    return new GraphQLInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          AND: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory)
            ),
          },
          OR: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory)
            ),
          },
        };

        Object.values(modelType.getFields()).forEach(field => {
          const fieldFactories = self.getFieldFactories(field);
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
    return Selectors.filter(isApplicable(field)).map(selectorToFieldFactory);
  },
};
