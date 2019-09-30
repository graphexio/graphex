import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLInt } from 'graphql';
import { IAMQuerySelector } from '../../types';

export const SizeSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  },
  getFieldFactory() {
    return {
      getFieldName(field) {
        return `${field.name}_size`;
      },
      getField(field, schemaInfo) {
        return {
          name: this.getFieldName(field),
          type: GraphQLInt,
          mmTransform: params => params,
        };
      },
    };
  },
};

//   getTransformInput() {
//     const fieldName = this.getFieldName();
//     return input => ({
//       [fieldName]: { $size: extractValue(input) },
//     });
//   }
// }
