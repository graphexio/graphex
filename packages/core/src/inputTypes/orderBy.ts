import { EnumValueNode, getNamedType, isCompositeType } from 'graphql';
import { AMEnumType, AMModelType, AMTypeFactory } from '../definitions';
import { AMOperation } from '../execution/operation';

export class AMOrderByTypeFactory extends AMTypeFactory<AMEnumType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}OrderByInput`;
  }
  getType(modelType: AMModelType) {
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
        const lastInStack = stack.last();

        if (lastInStack instanceof AMOperation) {
          lastInStack.setOrderBy(values[node.value].value);
        }
      },
    });
  }
}
