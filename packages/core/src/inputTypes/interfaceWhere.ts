import { GraphQLInterfaceType, isInterfaceType } from 'graphql';
import { AMInputObjectType, AMModelType, AMTypeFactory } from '../definitions';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMReadOperation } from '../execution/operations/readOperation';
import { defaultObjectFieldVisitorHandler } from './visitorHandlers';

export class AMInterfaceWhereTypeFactory extends AMTypeFactory<
  AMInputObjectType
> {
  isApplicable(type: AMModelType) {
    return isInterfaceType(type);
  }
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}InterfaceWhereInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};
        fields['aclWhere'] = {
          type: this.configResolver.resolveInputType(
            modelType,
            this.links.whereACL
          ),
          ...defaultObjectFieldVisitorHandler('aclWhere'),
        };
        if (modelType instanceof GraphQLInterfaceType) {
          [
            modelType,
            ...(this.schemaInfo.schema.getPossibleTypes(
              modelType
            ) as AMModelType[]),
          ].forEach((possibleType: AMModelType) => {
            fields[possibleType.name] = {
              type: this.configResolver.resolveInputType(
                possibleType,
                this.links.where
              ),
              ...(!modelType.mmAbstract
                ? {
                    // amEnter(node, transaction, stack) {
                    //   },
                    amLeave(node, transaction, stack) {
                      if (
                        modelType.mmDiscriminatorField &&
                        possibleType.mmDiscriminator
                      ) {
                        const lastInStack = stack.last();
                        if (lastInStack instanceof AMReadOperation) {
                          if (lastInStack.selector) {
                            lastInStack.selector.addValue(
                              modelType.mmDiscriminatorField,
                              possibleType.mmDiscriminator
                            );
                          }
                        } else if (
                          lastInStack instanceof AMObjectFieldContext
                        ) {
                          lastInStack.addValue(
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
                    //   const lastInStack = stack.last();
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
  }
}
