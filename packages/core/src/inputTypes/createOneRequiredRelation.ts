import R from 'ramda';
import { AMReadOperation } from '../execution/operations/readOperation';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
} from '../definitions';
import { AMCreateTypeFactory } from './create';
import { AMWhereUniqueTypeFactory } from './whereUnique';
import { AMDataContext } from '../execution/contexts/data';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { isInterfaceType } from 'graphql';
import { AMInterfaceCreateTypeFactory } from './interfaceCreate';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { UserInputError } from 'apollo-server';
import { AMInterfaceWhereUniqueTypeFactory } from './interfaceWhereUnique';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMCreateOneRequiredRelationTypeFactory: IAMTypeFactory<AMInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}CreateOneRequiredRelationInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;

    const createTypeFactory = !isInterfaceType(modelType)
      ? AMCreateTypeFactory
      : AMInterfaceCreateTypeFactory;

    const whereTypeFactory = !isInterfaceType(modelType)
      ? AMWhereUniqueTypeFactory
      : AMInterfaceWhereUniqueTypeFactory;

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
            type: schemaInfo.resolveFactoryType(modelType, createTypeFactory),
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
            type: schemaInfo.resolveFactoryType(modelType, whereTypeFactory),
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
  },
};
