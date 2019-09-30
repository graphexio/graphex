import { getNamedType, GraphQLEnumType, isCompositeType } from 'graphql';
import { AMModelType, IAMTypeFactory } from '../types';

export const AMOrderByTypeFactory: IAMTypeFactory<GraphQLEnumType> = {
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

    return new GraphQLEnumType({
      name: this.getTypeName(modelType),
      values,
    });
  },
};
