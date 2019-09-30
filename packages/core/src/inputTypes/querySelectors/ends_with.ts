import { getNamedType, GraphQLInputType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../types';

export const EndsWithSelector: IAMQuerySelector = {
  isApplicable(field) {
    return getNamedType(field.type).toString() === 'String';
  },
  getFieldFactory() {
    return {
      getFieldName(field) {
        return `${field.name}_ends_with`;
      },
      getField(field, schemaInfo) {
        const namedType = getNamedType(field.type);
        let type: GraphQLInputType;

        if (!isCompositeType(namedType)) {
          type = namedType;
        }

        return {
          name: this.getFieldName(field),
          type,
          mmTransform: params => params,
        };
      },
    };
  },
};

// getTransformInput() {
//   const fieldName = this.getFieldName();
//   return input => ({
//     [fieldName]: { $regex: new RegExp(`${extractValue(input)}$`) },
//   });
// }
