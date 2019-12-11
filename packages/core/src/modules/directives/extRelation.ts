import TypeWrap from '@apollo-model/type-wrap';
import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import * as HANDLER from '../../inputTypes/handlers';
import { INPUT_TYPE_KIND } from '../../inputTypes/kinds';
import { appendTransform } from '../../inputTypes/utils';
import { AMModelField, AMModelType } from '../../definitions';
import { getRelationFieldName } from '../../utils';

export const typeDef = gql`
  directive @extRelation(
    field: String = "_id"
    storeField: String = null
    many: Boolean = false
  ) on FIELD_DEFINITION
`;

export class ExtRelationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField, { objectType }) {
    // let { field: relationField, storeField } = this.args;
    // const typeWrap = new TypeWrap(field.type);
    // const type = typeWrap.realType() as AMModelType;
    // console.log(type);
    // if (!storeField)
    //   storeField = getRelationFieldName(
    //     type.name,
    //     relationField,
    //     typeWrap.isMany()
    //   );
    // field.relation = {
    //   external: true,
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

export const schemaDirectives = {
  extRelation: ExtRelationDirective,
};
