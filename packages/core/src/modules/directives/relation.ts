import { SchemaDirectiveVisitor } from 'graphql-tools';
import gql from 'graphql-tag';

import * as HANDLER from '../../inputTypes/handlers';
import { INPUT_TYPE_KIND } from '../../inputTypes/kinds';
import * as Transforms from '../../inputTypes/transforms';
import {
  appendTransform,
  applyInputTransform,
  reduceTransforms,
} from '../../inputTypes/utils';
import { AMModelField, AMModelType } from '../../definitions';
import { getNamedType } from 'graphql';
import TypeWrap from '@apollo-model/type-wrap';
import { allQueryArgs, getDirective, getRelationFieldName } from '../../utils';

export const typeDef = gql`
  directive @relation(
    field: String = "_id"
    storeField: String = null
  ) on FIELD_DEFINITION
`;

export class RelationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField, { objectType }) {
    // let { field: relationField, storeField } = this.args;
    // const typeWrap = new TypeWrap(field.type);
    // const type = typeWrap.realType() as AMModelType;
    // if (!storeField)
    //   storeField = getRelationFieldName(
    //     type.name,
    //     relationField,
    //     typeWrap.isMany()
    //   );
    // field.relation = {
    //   external: false,
    //   relationField: relationField,
    //   storeField: storeField,
    //   collection: type.mmCollectionName,
    // };
    // appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
    //   [INPUT_TYPE_KIND.ORDER_BY]: field => [],
    //   [INPUT_TYPE_KIND.CREATE]: field => [],
    //   [INPUT_TYPE_KIND.UPDATE]: field => [],
    //   [INPUT_TYPE_KIND.WHERE]: field => [],
    // });
  }
}

const DirectiveRealationResolver = (next, source, args, ctx, info) => {
  const { storeField } = args;
  info.fieldName = storeField;
  return next();
};

export const schemaDirectives = {
  relation: RelationDirective,
};

export const directiveResolvers = {
  relation: DirectiveRealationResolver,
};
