import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLInt } from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMQuerySelectorFieldFactory } from './fieldFactory';

export const NotSizeSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      field => `${field.name}_not_size`,
      (field, schemaInfo) => {
        return GraphQLInt;
      },
      value => ({
        $not: { $size: value },
      })
    );
  },
};

//   getTransformInput() {
//     const fieldName = this.getFieldName();
//     return input => ({
//       [fieldName]: { $not: { $size: extractValue(input) } },
//     });
//   }
// }
