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
  IAMTypeFactory,
} from '../definitions';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMCreateTypeFactory } from './create';

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
    const self: IAMTypeFactory<AMInputObjectType> = this;

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};
        if (modelType instanceof GraphQLInterfaceType) {
          (this.schemaInfo.schema.getPossibleTypes(
            modelType
          ) as AMModelType[]).forEach((possibleType: AMModelType) => {
            fields[possibleType.name] = <AMInputFieldConfig>{
              type: this.schemaInfo.resolveFactoryType(
                possibleType,
                AMCreateTypeFactory
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
                            .path('_id')
                            .dbRef(possibleType.mmCollectionName)
                        );
                      } else if (lastInStack instanceof AMListValueContext) {
                        lastInStack.addValue(
                          createOp
                            .getOutput()
                            .path('_id')
                            .dbRef(possibleType.mmCollectionName)
                        );
                      }
                    },
                  }),
            };
          });
        }

        return fields;
      },
    });
  }
}
