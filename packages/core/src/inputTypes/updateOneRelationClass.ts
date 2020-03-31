import { isInterfaceType } from 'graphql';
import R from 'ramda';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
  IAMTypeFactory,
} from '../definitions';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMCreateTypeFactory } from './create';
import { AMInterfaceCreateTypeFactory } from './interfaceCreate';
import { AMInterfaceWhereUniqueTypeFactory } from './interfaceWhereUnique';
import { AMWhereUniqueTypeFactory } from './whereUnique';

export class AMUpdateOneRelationTypeFactory extends AMTypeFactory<
  AMInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateOneRelationInput`;
  }
  getType(modelType: AMModelType) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    const createTypeFactory = !isInterfaceType(modelType)
      ? AMCreateTypeFactory
      : AMInterfaceCreateTypeFactory;

    const whereTypeFactory = !isInterfaceType(modelType)
      ? AMWhereUniqueTypeFactory
      : AMInterfaceWhereUniqueTypeFactory;

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          create: {
            type: this.schemaInfo.resolveFactoryType(
              modelType,
              createTypeFactory
            ),
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
            type: this.schemaInfo.resolveFactoryType(
              modelType,
              whereTypeFactory
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
  }
}
