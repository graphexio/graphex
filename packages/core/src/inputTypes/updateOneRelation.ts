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

export class AMUpdateOneRelationTypeFactory extends AMTypeFactory<
  AMInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateOneRelationInput`;
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
            amEnter(node, transaction, stack) {
              const opContext = new AMCreateOperation(transaction, {
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
                      new ResultPromiseTransforms.Path(
                        lastInStack.field.relation.relationField
                      )
                    )
                );
              }
            },
          },
          connect: {
            type: this.configResolver.resolveInputType(modelType, [
              'whereUnique',
              'interfaceWhereUnique',
            ]),
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
                      new ResultPromiseTransforms.Path(
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
