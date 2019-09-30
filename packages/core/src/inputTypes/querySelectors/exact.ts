import {
  getNamedType,
  GraphQLInputType,
  isCompositeType,
  GraphQLList,
} from 'graphql';
import { IAMQuerySelector } from '../../types';
import TypeWrap from '@apollo-model/type-wrap';
import { AMWhereCleanTypeFactory } from '../whereClean';

export const ExactSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  },
  getFieldFactory() {
    return {
      getFieldName(field) {
        return `${field.name}_exact`;
      },
      getField(field, schemaInfo) {
        const namedType = getNamedType(field.type);
        let type: GraphQLInputType;

        if (!isCompositeType(namedType)) {
          type = new GraphQLList(namedType);
        } else {
          type = new GraphQLList(
            schemaInfo.resolveFactoryType(namedType, AMWhereCleanTypeFactory)
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
//     const fieldName = this.getFieldName();
//     return input => ({
//       [fieldName]: { $eq: makeArray(extractValue(input)) },
//     });
//   }
