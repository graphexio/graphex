import {
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  isInterfaceType,
} from 'graphql';
import {
  AMInputFieldConfig,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../../definitions';
import { AMListValueContext } from '../../../../execution/contexts/listValue';
import { AMObjectFieldContext } from '../../../../execution/contexts/objectField';
import { AMReadOperation } from '../../../../execution/operations/readOperation';
import { ResultPromiseTransforms } from '../../../../execution/resultPromise';
import {
  defaultObjectFieldVisitorHandler,
  whereTypeVisitorHandler,
} from './visitorHandlers';
import { AMSelectorContext } from '../../../../execution';

export class AMInterfaceWhereUniqueTypeFactory extends AMTypeFactory<GraphQLInputObjectType> {
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
                        const lastInStack = stack.last();
                        if (lastInStack instanceof AMSelectorContext) {
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
                      const lastInStack = stack.last();

                      if (lastInStack instanceof AMObjectFieldContext) {
                        lastInStack.setValue(
                          readOp
                            .getOutput()
                            .map(new ResultPromiseTransforms.Path('_id'))
                            .map(
                              new ResultPromiseTransforms.ToDbRef(
                                possibleType.mmCollectionName
                              )
                            )
                        );
                      } else if (lastInStack instanceof AMListValueContext) {
                        lastInStack.addValue(
                          readOp
                            .getOutput()
                            .map(new ResultPromiseTransforms.Path('_id'))
                            .map(
                              new ResultPromiseTransforms.ToDbRef(
                                possibleType.mmCollectionName
                              )
                            )
                        );
                      }
                    },
                  }),
            } as AMInputFieldConfig;
          });
        }

        return fields;
      },
      ...(modelType.mmAbstract
        ? {} //TODO: fix for abstract interfaces
        : whereTypeVisitorHandler({ emptyAllowed: false })),
    });
  }
}
