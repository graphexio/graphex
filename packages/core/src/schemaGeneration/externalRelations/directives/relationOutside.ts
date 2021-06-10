import TypeWrap from '@graphex/type-wrap';
import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AMModelField, AMModelType } from '../../../definitions';
import { getRelationFieldName } from '../../../utils';

export const typeDef = gql`
  directive @relationOutside(storeField: String = null) on FIELD_DEFINITION
`;

export class RelationOutsideDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField) {
    const typeWrap = new TypeWrap(field.type);
    const isMany = typeWrap.isMany();
    const relationType = typeWrap.realType() as AMModelType;
    const storeField =
      this?.args?.storeField ??
      getRelationFieldName(relationType.name, 'id', isMany);

    field.relationOutside = {
      storeField,
    };

    if (isMany) {
      field.resolve = parent =>
        parent[storeField]?.map(item => ({
          [relationType.mmUniqueFields?.[0]?.name]: item,
        }));
    } else {
      field.resolve = parent => ({
        [relationType.mmUniqueFields?.[0]?.name]: parent[storeField],
      });
    }
  }
}

export const schemaDirectives = {
  relationOutside: RelationOutsideDirective,
};
