import { UserInputError } from 'apollo-server';
import { isInterfaceType } from 'graphql';
import R from 'ramda';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  AMModelType,
  AMTypeFactory,
  IAMInputFieldFactory,
  IAMTypeFactory,
} from '../definitions';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMReadOperation } from '../execution/operations/readOperation';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export class AMCreateOneRequiredRelationTypeFactory extends AMTypeFactory<
  AMInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateOneRequiredRelationInput`;
  }
  getType(modelType: AMModelType) {
    const self: IAMTypeFactory<AMInputObjectType> = this;

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      amEnter(node, transaction, stack) {
        if (node.fields.length != 1) {
          throw new UserInputError(`'create' or 'connect' needed`);
        }
      },
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
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
                          .path(lastInStack.field.relation.relationField)
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
                    .path(lastInStack.field.relation.relationField)
                );
              }
            },
          },
        };

        return fields;
      },
    });
  }
}
