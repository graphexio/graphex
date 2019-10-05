import { GraphQLBoolean } from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export const ExistsSelector: IAMQuerySelector = {
  isApplicable(field) {
    return true;
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
      field => `${field.name}_exists`,
      (field, schemaInfo) => {
        return GraphQLBoolean;
      },
      value => ({
        $exists: value,
      })
    );
  },
};
