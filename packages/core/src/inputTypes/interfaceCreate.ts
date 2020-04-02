import {
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  isInterfaceType,
} from 'graphql';
import R from 'ramda';
import {
  AMInputFieldConfig,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { ResultPromiseTransforms } from '../execution/resultPromise';

export class AMInterfaceCreateTypeFactory extends AMTypeFactory<
  GraphQLInputObjectType
> {
  isApplicable(modelType: AMModelType) {
    return isInterfaceType(modelType);
  }
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}InterfaceCreateInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};
        if (modelType instanceof GraphQLInterfaceType) {
          (this.schemaInfo.schema.getPossibleTypes(
            modelType
          ) as AMModelType[]).forEach((possibleType: AMModelType) => {
            fields[possibleType.name] = {
              type: this.configResolver.resolveInputType(
                possibleType,
                'create'
              ),
              ...(!modelType.mmAbstract
                ? {
                    // amEnter(node, transaction, stack) {
                    //   },
                    amLeave(node, transaction, stack) {
                      const lastInStack = R.last(stack);
                      if (lastInStack instanceof AMCreateOperation) {
                        if (lastInStack.data) {
                          lastInStack.data.addValue(
                            modelType.mmDiscriminatorField,
                            possibleType.mmDiscriminator
                          );
                        }
                      }
                    },
                  }
                : {
                    amEnter(node, transaction, stack) {
                      const createOperation = new AMCreateOperation(
                        transaction,
                        {
                          many: false,
                          collectionName: possibleType.mmCollectionName,
                        }
                      );
                      stack.push(createOperation);
                    },
                    amLeave(node, transaction, stack) {
                      const createOp = stack.pop() as AMCreateOperation;
                      const lastInStack = R.last(stack);
                      if (lastInStack instanceof AMObjectFieldContext) {
                        lastInStack.setValue(
                          createOp
                            .getOutput()
                            .map(ResultPromiseTransforms.path('_id'))
                            .dbRef(possibleType.mmCollectionName)
                        );
                      } else if (lastInStack instanceof AMListValueContext) {
                        lastInStack.addValue(
                          createOp
                            .getOutput()
                            .map(ResultPromiseTransforms.path('_id'))
                            .dbRef(possibleType.mmCollectionName)
                        );
                      }
                    },
                  }),
            } as AMInputFieldConfig;
          });
        }

        return fields;
      },
    });
  }
}
