import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType, GraphQLInputType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMWhereTypeFactory } from '../where';

export const AsIsSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return !typeWrap.isMany();
  },
  getFieldFactory() {
    return {
      getFieldName(field) {
        return `${field.name}`;
      },
      getField(field, schemaInfo) {
        const namedType = getNamedType(field.type);
        let type: GraphQLInputType;
        if (!isCompositeType(namedType)) {
          type = namedType;
        } else {
          type = schemaInfo.resolveFactoryType(namedType, AMWhereTypeFactory);
          // return this._getInputType(
          //   realType,
          //   isInterface ? INPUT_TYPE_KIND.WHERE_INTERFACE : INPUT_TYPE_KIND.WHERE
          // );
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
//   const isNested = this._typeWrap.isNested();

//   return reduceTransforms([isNested ? Transforms.flattenNested : null]);
// }
