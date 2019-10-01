import { GraphQLBoolean, getNamedType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMQuerySelectorFieldFactory } from './fieldFactory';

export const LTSelector: IAMQuerySelector = {
  isApplicable(field) {
    const namedType = getNamedType(field.type);
    return ['Int', 'Float', 'Date', 'String'].includes(namedType.toString());
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      field => `${field.name}_lt`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);
        if (!isCompositeType(namedType)) {
          return namedType;
        }
      },
      value => ({
        $lt: value,
      })
    );
  },
};

// getTransformInput() {
//   const fieldName = this.getFieldName();
//   return input => ({
//     [fieldName]: { $lt: extractValue(input) },
//   });
// }
