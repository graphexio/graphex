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

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMCreateOneRequiredRelationTypeFactory: IAMTypeFactory<AMInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}CreateOneRequiredRelationInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    const typeFactory = !isInterfaceType(modelType)
      ? AMCreateTypeFactory
      : AMInterfaceCreateTypeFactory;

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
            type: schemaInfo.resolveFactoryType(modelType, typeFactory),
            amEnter(node, transaction, stack) {
              const opContext = new AMCreateOperation(transaction, {
                many: false,
                collectionName: modelType.mmCollectionName,
              });
              stack.push(opContext);
            },
            amLeave(node, transaction, stack) {
              const opContext = stack.pop() as AMReadOperation;

              const lastInStack = R.last(stack);
              if (lastInStack instanceof AMObjectFieldContext) {
                lastInStack.setValue(opContext.getOutput());
              }
            },
          },
          connect: {
            type: schemaInfo.resolveFactoryType(
              modelType,
              AMWhereUniqueTypeFactory
            ),
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
                lastInStack.setValue(opContext.getOutput());
              }
            },
          },
        };

        return fields;
      },
    });
  },
};
