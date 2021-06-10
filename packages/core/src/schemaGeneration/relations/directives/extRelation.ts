import gql from 'graphql-tag';

export const typeDef = gql`
  directive @extRelation(
    field: String = "_id"
    storeField: String = null
    many: Boolean = false
  ) on FIELD_DEFINITION
`;
