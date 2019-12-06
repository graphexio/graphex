import { GraphQLInputObjectType, GraphQLInterfaceType } from 'graphql';
import R from 'ramda';
import { AMCreateOperation } from '../execution/operations/createOperation';
import {
  AMInputFieldConfig,
  AMInputObjectType,
  AMModelType,
  IAMTypeFactory,
} from '../types';
import { AMWhereTypeFactory } from './where';

export const AMInterfaceWhereTypeFactory: IAMTypeFactory<
  GraphQLInputObjectType
> = {
  getTypeName(modelType): string {
    return `${modelType.name}InterfaceWhereInput`;
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
                AMWhereTypeFactory
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
                    // amEnter(node, transaction, stack) {
                    //   const createOperation = new AMCreateOperation(
                    //     transaction,
                    //     {
                    //       many: false,
                    //       collectionName: possibleType.mmCollectionName,
                    //     }
                    //   );
                    //   stack.push(createOperation);
                    // },
                    // amLeave(node, transaction, stack) {
                    //   const createOp = stack.pop() as AMCreateOperation;
                    //   const lastInStack = R.last(stack);
                    //   if (lastInStack instanceof AMObjectFieldContext) {
                    //     lastInStack.setValue(
                    //       createOp
                    //         .getOutput()
                    //         .path('_id')
                    //         .dbRef(possibleType.mmCollectionName)
                    //     );
                    //   } else if (lastInStack instanceof AMListValueContext) {
                    //     lastInStack.addValue(
                    //       createOp
                    //         .getOutput()
                    //         .path('_id')
                    //         .dbRef(possibleType.mmCollectionName)
                    //     );
                    //   }
                    // },
                  }),
            };
          });
        }

        return fields;
      },
    });
  },
};
