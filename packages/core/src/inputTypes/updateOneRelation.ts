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

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMUpdateOneRelationTypeFactory: IAMTypeFactory<AMInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}UpdateOneRelationInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    const typeFactory = !isInterfaceType(modelType)
      ? AMCreateTypeFactory
      : AMInterfaceCreateTypeFactory;

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
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
                lastInStack.setValue(
                  opContext
                    .getOutput()
                    .path(lastInStack.field.relation.relationField)
                );
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
