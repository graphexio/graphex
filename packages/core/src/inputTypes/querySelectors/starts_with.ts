import { getNamedType, GraphQLInputType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMQuerySelectorFieldFactory } from './fieldFactory';

export const StartsWithSelector: IAMQuerySelector = {
  isApplicable(field) {
    return getNamedType(field.type).toString() === 'String';
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      field => `${field.name}_starts_with`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);

        if (!isCompositeType(namedType)) {
          return namedType;
        }
      },
      value => ({
        $regex: new RegExp(`^${value}`),
      })
    );
  },
};

// getTransformInput() {
//   const fieldName = this.getFieldName();
//   return input => ({
//     [fieldName]: { $regex: new RegExp(`^${extractValue(input)}`) },
//   });
// }
