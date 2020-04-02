import { GraphQLInputObjectType, GraphQLList } from 'graphql';
import R from 'ramda';
import {
  AMInputFieldConfigMap,
  AMModelType,
  AMTypeFactory,
} from '../definitions';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMReadOperation } from '../execution/operations/readOperation';
import { ResultPromiseTransforms } from '../execution/resultPromise';

export class AMCreateManyRelationTypeFactory extends AMTypeFactory<
  GraphQLInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateManyRelationInput`;
  }
  getType(modelType: AMModelType) {
    return new GraphQLInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          create: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'create',
                'interfaceCreate',
              ])
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
                        opContext
                          .getOutput()
                          .map(ResultPromiseTransforms.path('insertedIds'))
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
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
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
                    .map(
                      ResultPromiseTransforms.distinct(
                        lastInStack.field.relation.relationField
                      )
                    )
                );
              }
            },
          },
        } as AMInputFieldConfigMap;

        return fields;
      },
    });
  }
}
