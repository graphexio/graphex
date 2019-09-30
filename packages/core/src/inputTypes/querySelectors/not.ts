import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLInt, getNamedType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../types';

export const NotSelector: IAMQuerySelector = {
  isApplicable(field) {
    const namedType = getNamedType(field.type);
    return !isCompositeType(namedType);
  },
  getFieldFactory() {
    return {
      getFieldName(field) {
        return `${field.name}_not`;
      },
      getField(field, schemaInfo) {
        const namedType = getNamedType(field.type);
        let type;
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

//   getTransformInput() {
//     const fieldName = this.getFieldName();
//     return input => ({
//       [fieldName]: { $not: { $eq: extractValue(input) } },
//     });
//   }
// }
