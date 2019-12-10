import { GraphQLInputObjectType, GraphQLList, isInterfaceType } from 'graphql';
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
import { AMInterfaceCreateTypeFactory } from './interfaceCreate';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMDataContext } from '../execution/contexts/data';
import { AMListValueContext } from '../execution/contexts/listValue';
import { toArray } from '../tsutils';
import { AMWhereTypeFactory } from './where';
import { AMInterfaceWhereWhereUniqueTypeFactory } from './interfaceWhereUnique';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMCreateManyRelationTypeFactory: IAMTypeFactory<GraphQLInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}CreateManyRelationInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<GraphQLInputObjectType> = this;

    const createTypeFactory = !isInterfaceType(modelType)
      ? AMCreateTypeFactory
      : AMInterfaceCreateTypeFactory;

    const whereTypeFactory = !isInterfaceType(modelType)
      ? AMWhereUniqueTypeFactory
      : AMInterfaceWhereWhereUniqueTypeFactory;

    return new GraphQLInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          create: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, createTypeFactory)
            ),
            /* For abstract interface we create operations inside AMInterfaceCreateTypeFactory */
            ...(!modelType.mmAbstract
              ? {
                  amEnter(node, transaction, stack) {
                    const opContext = new AMCreateOperation(transaction, {
                      many: true,
                      collectionName: modelType.mmCollectionName,
                    });
                    stack.push(opContext);

                    /* Next context will be List and it hasn't default 
                    instructions how to pass value into operation */

                    const listContext = new AMListValueContext();
                    listContext.setProxy(true);
                    stack.push(listContext);
                  },
                  amLeave(node, transaction, stack) {
                    const listContext = stack.pop() as AMListValueContext;
                    const opContext = stack.pop() as AMReadOperation;
                    opContext.setDataList(listContext);

                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMObjectFieldContext) {
                      lastInStack.setValue(
                        opContext.getOutput().path('insertedIds')
                      );
                    }
                  },
                }
              : {
                  amEnter(node, transaction, stack) {
                    const listContext = new AMListValueContext();
                    listContext.setProxy(true);
                    stack.push(listContext);
                  },
                  amLeave(node, transaction, stack) {
                    const listContext = stack.pop() as AMListValueContext;
                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMObjectFieldContext) {
                      lastInStack.setValue(listContext.values);
                    }
                  },
                }),
          },
          connect: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, whereTypeFactory)
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
                lastInStack.setValue(
                  opContext
                    .getOutput()
                    .distinct(lastInStack.field.relation.relationField)
                );
              }
            },
          },
        };

        return fields;
      },
    });
  },
};
