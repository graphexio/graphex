import {
  getNamedType,
  GraphQLEnumType,
  isCompositeType,
  EnumValueNode,
} from 'graphql';
import { AMModelType, IAMTypeFactory, AMEnumType } from '../definitions';
import R from 'ramda';
import { AMOperation } from '../execution/operation';

export const AMOrderByTypeFactory: IAMTypeFactory<AMEnumType> = {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}OrderByInput`;
  },
  getType(modelType: AMModelType, resolveModelType) {
    const values = {};
    Object.values(modelType.getFields()).forEach(field => {
      if (!isCompositeType(getNamedType(field.type))) {
        values[`${field.name}_ASC`] = { value: { [field.dbName]: 1 } };
        values[`${field.name}_DESC`] = { value: { [field.dbName]: -1 } };
      }
    });

    return new AMEnumType({
      name: this.getTypeName(modelType),
      values,
      amLeave(node: EnumValueNode, transaction, stack) {
        const lastInStack = R.last(stack);

        if (lastInStack instanceof AMOperation) {
          lastInStack.setOrderBy(values[node.value].value);
        }
      },
    });
  },
};
