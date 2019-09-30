import { GraphQLBoolean } from 'graphql';
import { IAMQuerySelector } from '../../types';

export const ExistsSelector: IAMQuerySelector = {
  isApplicable(field) {
    return true;
  },
  getFieldFactory() {
    return {
      getFieldName(field) {
        return `${field.name}_exists`;
      },
      getField(field, schemaInfo) {
        return {
          name: this.getFieldName(field),
          type: GraphQLBoolean,
          mmTransform: params => params,
        };
      },
    };
  },
};

// getTransformInput() {
//   const fieldName = this.getFieldName();
//   return input => ({
//     [fieldName]: { $exists: extractValue(input) },
//   });
// }
