import { GraphQLBoolean, getNamedType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMQuerySelectorFieldFactory } from './fieldFactory';

export const GTESelector: IAMQuerySelector = {
  isApplicable(field) {
    const namedType = getNamedType(field.type);
    return ['Int', 'Float', 'Date', 'String'].includes(namedType.toString());
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      field => `${field.name}_gte`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);
        if (!isCompositeType(namedType)) {
          return namedType;
        }
      },
      value => ({
        $gte: value,
      })
    );
  },
};
