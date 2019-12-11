import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLInt } from 'graphql';
import { IAMQuerySelector } from '../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export const SizeSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
      field => `${field.name}_size`,
      (field, schemaInfo) => {
        return GraphQLInt;
      },
      value => ({
        $size: value,
      })
    );
  },
};

//   getTransformInput() {
//     const fieldName = this.getFieldName();
//     return input => ({
//       [fieldName]: { $size: extractValue(input) },
//     });
//   }
// }
