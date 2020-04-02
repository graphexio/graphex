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
import { AMReadOperation } from '../execution/operations/readOperation';
import { ResultPromiseTransforms } from '../execution/resultPromise';

export class AMInterfaceWhereUniqueTypeFactory extends AMTypeFactory<
  GraphQLInputObjectType
> {
  isApplicable(type: AMModelType) {
    return isInterfaceType(type);
  }
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}InterfaceWhereUniqueInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};
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
                this.links.whereUnique
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
                        const lastInStack = R.last(stack);
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
                            .map(ResultPromiseTransforms.path('_id'))
                            .dbRef(possibleType.mmCollectionName)
                        );
                      } else if (lastInStack instanceof AMListValueContext) {
                        lastInStack.addValue(
                          readOp
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
