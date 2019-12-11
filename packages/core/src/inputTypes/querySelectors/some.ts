import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLInputType,
  GraphQLList,
  isCompositeType,
} from 'graphql';
import { IAMQuerySelector } from '../../definitions';
import { AMWhereCleanTypeFactory } from '../whereClean';
import { AMWhereTypeFactory } from '../where';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export const SomeSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
      field => `${field.name}_some`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);
        if (!isCompositeType(namedType)) {
          return new GraphQLList(namedType);
        } else {
          return new GraphQLList(
            schemaInfo.resolveFactoryType(namedType, AMWhereTypeFactory)
          );
        }
      },
      value => ({
        $elemMatch: value,
      })
    );
  },
};

// getTransformInput() {
//   const fieldName = this.getFieldName();
//   return input => ({
//     [fieldName]: { $elemMatch: extractValue(input) },
//   });
// }
