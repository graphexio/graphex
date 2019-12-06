import {
  GraphQLInputObjectType,
  ObjectFieldNode,
  GraphQLInterfaceType,
} from 'graphql';
import R from 'ramda';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import {
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
  AMInputFieldConfig,
  AMObjectType,
  AMModelType,
  AMInterfaceType,
} from '../types';
import { AMCreateTypeFactory } from './create';
import { AMDataContext } from '../execution/contexts/data';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMListValueContext } from '../execution/contexts/listValue';

export const AMInterfaceCreateTypeFactory: IAMTypeFactory<
  GraphQLInputObjectType
> = {
  getTypeName(modelType): string {
    return `${modelType.name}InterfaceCreateInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};
        if (modelType instanceof GraphQLInterfaceType) {
          (schemaInfo.schema.getPossibleTypes(
            modelType
          ) as AMModelType[]).forEach((possibleType: AMModelType) => {
            fields[possibleType.name] = <AMInputFieldConfig>{
              type: schemaInfo.resolveFactoryType(
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
  },
};
