import { GraphQLInputObjectType, GraphQLInterfaceType } from 'graphql';
import R from 'ramda';
import { AMCreateOperation } from '../execution/operations/createOperation';
import {
  AMInputFieldConfig,
  AMInputObjectType,
  AMModelType,
  IAMTypeFactory,
} from '../types';
import { AMWhereUniqueTypeFactory } from './whereUnique';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMListValueContext } from '../execution/contexts/listValue';

export const AMInterfaceWhereWhereUniqueTypeFactory: IAMTypeFactory<
  GraphQLInputObjectType
> = {
  getTypeName(modelType): string {
    return `${modelType.name}InterfaceWhereUniqueInput`;
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
                AMWhereUniqueTypeFactory
              ),
              ...(!modelType.mmAbstract
                ? {
                    // amEnter(node, transaction, stack) {
                    //   },
                    amLeave(node, transaction, stack) {
                      const lastInStack = R.last(stack);
                      console.log({ lastInStack });
                      if (lastInStack instanceof AMReadOperation) {
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
                      const readOperation = new AMReadOperation(transaction, {
                        many: false,
                        collectionName: possibleType.mmCollectionName,
                      });
                      stack.push(readOperation);
                    },
                    amLeave(node, transaction, stack) {
                      const readOp = stack.pop() as AMReadOperation;
                      const lastInStack = R.last(stack);

                      if (lastInStack instanceof AMObjectFieldContext) {
                        lastInStack.setValue(
                          readOp
                            .getOutput()
                            .path('_id')
                            .dbRef(possibleType.mmCollectionName)
                        );
                      } else if (lastInStack instanceof AMListValueContext) {
                        lastInStack.addValue(
                          readOp
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
