import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLInputType,
  GraphQLList,
  isCompositeType,
} from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMWhereCleanTypeFactory } from '../whereClean';
import { AMWhereTypeFactory } from '../where';

export const SomeSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  },
  getFieldFactory() {
    return {
      getFieldName(field) {
        return `${field.name}_some`;
      },
      getField(field, schemaInfo) {
        const namedType = getNamedType(field.type);
        let type: GraphQLInputType;
        if (!isCompositeType(namedType)) {
          type = new GraphQLList(namedType);
        } else {
          type = new GraphQLList(
            schemaInfo.resolveFactoryType(namedType, AMWhereTypeFactory)
          );
        }
        return {
          name: this.getFieldName(field),
          type,
          mmTransform: params => params,
        };
      },
    };
  },
};

// getTransformInput() {
//   const fieldName = this.getFieldName();
//   return input => ({
//     [fieldName]: { $elemMatch: extractValue(input) },
//   });
// }
