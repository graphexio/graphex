import R from 'ramda';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMReadOperation } from '../execution/operations/readOperation';
import { ResultPromiseTransforms } from '../execution/resultPromise';

export class AMCreateOneRelationTypeFactory extends AMTypeFactory<
  AMInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateOneRelationInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          create: {
            type: this.configResolver.resolveInputType(modelType, [
              'create',
              'interfaceCreate',
            ]),
            /* For abstract interface we create operations inside AMInterfaceCreateTypeFactory */
            ...(!modelType.mmAbstract
              ? {
                  amEnter(node, transaction, stack) {
                    const opContext = new AMCreateOperation(transaction, {
                      many: false,
                      collectionName: modelType.mmCollectionName,
                    });
                    stack.push(opContext);
                  },
                  amLeave(node, transaction, stack) {
                    const opContext = stack.pop() as AMCreateOperation;

                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMObjectFieldContext) {
                      lastInStack.setValue(
                        opContext
                          .getOutput()
                          .map(
                            ResultPromiseTransforms.path(
                              lastInStack.field.relation.relationField
                            )
                          )
                      );
                    }
                  },
                }
              : null),
          },
          connect: {
            type: this.configResolver.resolveInputType(modelType, [
              'whereUnique',
              'interfaceWhereUnique',
            ]),
            ...(!modelType.mmAbstract
              ? {
                  amEnter(node, transaction, stack) {
                    const opContext = new AMReadOperation(transaction, {
                      many: false,
                      collectionName: modelType.mmCollectionName,
                    });
                    stack.push(opContext);
                  },
                  amLeave(node, transaction, stack) {
                    const opContext = stack.pop() as AMReadOperation;

                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMObjectFieldContext) {
                      lastInStack.setValue(
                        opContext
                          .getOutput()
                          .map(
                            ResultPromiseTransforms.path(
                              lastInStack.field.relation.relationField
                            )
                          )
                      );
                    }
                  },
                }
              : null),
          },
        } as AMInputFieldConfigMap;

        return fields;
      },
    });
  }
}
