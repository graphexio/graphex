import gql from 'graphql-tag';

export const typeDef = gql`
  directive @relation(
    field: String = "_id"
    storeField: String = null
  ) on FIELD_DEFINITION
`;
