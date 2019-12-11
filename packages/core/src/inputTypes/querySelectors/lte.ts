import { GraphQLBoolean, getNamedType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export const LTESelector: IAMQuerySelector = {
  isApplicable(field) {
    const namedType = getNamedType(field.type);
    return ['Int', 'Float', 'Date', 'String'].includes(namedType.toString());
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
      field => `${field.name}_lte`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);
        if (!isCompositeType(namedType)) {
          return namedType;
        }
      },
      value => ({
        $lte: value,
      })
    );
  },
};

// getTransformInput() {
//   const fieldName = this.getFieldName();
//   return input => ({
//     [fieldName]: { $lte: extractValue(input) },
//   });
// }
