import { GraphQLInputObjectType } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
} from '../definitions';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import {
  AMUpdateOperation,
  ArrayFilter,
} from '../execution/operations/updateOperation';
import { getLastOperation } from '../execution/utils';
import { AMUpdateTypeFactory } from './update';
import { AMWhereTypeFactory } from './where';

export const AMUpdateWithWhereNestedTypeFactory: IAMTypeFactory<GraphQLInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}UpdateWithWhereNestedInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    let arrayFilter: ArrayFilter;

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          where: {
            type: schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory),
            amEnter(node, transaction, stack) {
              const context = new AMObjectFieldContext('where');
              stack.push(context);
            },
            amLeave(node, transaction, stack) {
              const context = stack.pop() as AMObjectFieldContext;
              arrayFilter.filter = context.value;
            },
          },
          data: {
            type: schemaInfo.resolveFactoryType(modelType, AMUpdateTypeFactory),
          },
        };

        return fields;
      },
      amEnter(node, transaction, stack) {
        const operation = getLastOperation(stack);
        if (!(operation instanceof AMUpdateOperation)) {
          throw new Error(
            'UpdateManyNested may be used with Update operation only'
          );
        }
        arrayFilter = operation.createArrayFilter();

        const context = new AMObjectFieldContext(`$[${arrayFilter.name}]`);
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        stack.pop();
      },
    });
  },
};
