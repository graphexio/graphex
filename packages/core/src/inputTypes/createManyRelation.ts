import { GraphQLInputObjectType, GraphQLList } from 'graphql';
import R from 'ramda';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMReadOperation } from '../execution/operations/readOperation';
import {
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
  AMInputFieldMap,
  AMInputFieldConfigMap,
} from '../types';
import { AMCreateTypeFactory } from './create';
import { AMWhereUniqueTypeFactory } from './whereUnique';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMCreateManyRelationTypeFactory: IAMTypeFactory<
  GraphQLInputObjectType
> = {
  getTypeName(modelType): string {
    return `${modelType.name}CreateManyRelationInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<GraphQLInputObjectType> = this;
    return new GraphQLInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          create: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, AMCreateTypeFactory)
            ),
          },
          connect: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, AMWhereUniqueTypeFactory)
            ),
            amEnter(node, transaction, stack) {
              const opContext = new AMReadOperation(transaction, {
                many: true,
                collectionName: modelType.mmCollectionName,
              });
              stack.push(opContext);

              /* Next context will be List and it hasn't default 
              instructions how to pass value into operation */

              const selectorContext = new AMSelectorContext();
              stack.push(selectorContext);

              const orContext = new AMObjectFieldContext('$or');
              stack.push(orContext);
            },
            amLeave(node, transaction, stack) {
              const orContext = stack.pop() as AMObjectFieldContext;
              const selectorContext = stack.pop() as AMSelectorContext;
              const opContext = stack.pop() as AMReadOperation;

              selectorContext.addValue(orContext.fieldName, orContext.value);

              opContext.setSelector(selectorContext);

              const lastInStack = R.last(stack);
              if (lastInStack instanceof AMObjectFieldContext) {
                lastInStack.setValue(opContext.getOutput());
              }
            },
          },
        };

        return fields;
      },
    });
  },
};
