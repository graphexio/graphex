import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLInt } from 'graphql';
import { IAMQuerySelector } from '../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export const NotSizeSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
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
