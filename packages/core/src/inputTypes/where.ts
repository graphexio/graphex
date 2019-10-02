import { GraphQLField, GraphQLInputObjectType, GraphQLList } from 'graphql';
import {
  IAMModelTypeFactory,
  IAMQuerySelector,
  AMInputObjectType,
} from '../types';
import { Selectors } from './querySelectors';
import { AMSelectorContext } from '../execution/contexts/selector';
import R from 'ramda';
import { AMOperation } from '../execution/operation';

const isApplicable = (field: GraphQLField<any, any, any>) => (
  selector: IAMQuerySelector
) => selector.isApplicable(field);

const selectorToFieldFactory = (selector: IAMQuerySelector) => {
  return selector.getFieldFactory();
};

export const AMWhereTypeFactory: IAMModelTypeFactory<AMInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}WhereInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMModelTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
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
      amEnter(node, transaction, stack) {
        const selectorAction = new AMSelectorContext();
        stack.push(selectorAction);
      },
      amLeave(node, transaction, stack) {
        const selectorAction = stack.pop() as AMSelectorContext;
        const lastInStack = R.last(stack);

        if (lastInStack instanceof AMOperation) {
          lastInStack.setSelector(selectorAction);
        }
      },
    });
  },
  getFieldFactories(field) {
    return Selectors.filter(isApplicable(field)).map(selectorToFieldFactory);
  },
};
