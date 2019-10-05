import { getNamedType, GraphQLInputType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export const EndsWithSelector: IAMQuerySelector = {
  isApplicable(field) {
    return getNamedType(field.type).toString() === 'String';
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
      field => `${field.name}_ends_with`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);

        if (!isCompositeType(namedType)) {
          return namedType;
        }
      },
      value => ({
        $regex: new RegExp(`${value}$`),
      })
    );
  },
};
