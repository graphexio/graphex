import { getNamedType, GraphQLInputType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export const ContainsSelector: IAMQuerySelector = {
  isApplicable(field) {
    return getNamedType(field.type).toString() === 'String';
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
      field => `${field.name}_contains`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);

        if (!isCompositeType(namedType)) {
          return namedType;
        }
      },
      value => ({
        $regex: new RegExp(value),
      })
    );
  },
};
