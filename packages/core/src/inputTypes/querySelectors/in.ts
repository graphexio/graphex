import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLInputType,
  GraphQLList,
  isCompositeType,
} from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMWhereCleanTypeFactory } from '../whereClean';

export const InSelector: IAMQuerySelector = {
  isApplicable(field) {
    const namedType = getNamedType(field.type);
    return ['ID', 'ObjectID', 'Int', 'Float', 'String'].includes(
      namedType.toString()
    );
  },
  getFieldFactory() {
    return {
      getFieldName(field) {
        return `${field.name}_in`;
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
//   const fieldName = this.getFieldName();
//   return input => ({
//     [fieldName]: { $in: makeArray(extractValue(input)) },
//   });
// }
