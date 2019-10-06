import R from 'ramda';
import { AMReadOperation } from '../execution/operations/readOperation';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
} from '../types';
import { AMCreateTypeFactory } from './create';
import { AMWhereUniqueTypeFactory } from './whereUnique';
import { AMDataContext } from '../execution/contexts/data';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMObjectFieldContext } from '../execution/contexts/objectField';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMCreateOneRelationTypeFactory: IAMTypeFactory<
  AMInputObjectType
> = {
  getTypeName(modelType): string {
    return `${modelType.name}CreateOneRelationInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          create: {
            type: schemaInfo.resolveFactoryType(modelType, AMCreateTypeFactory),
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
