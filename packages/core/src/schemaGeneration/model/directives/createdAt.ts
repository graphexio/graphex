import gql from 'graphql-tag';

export const typeDef = gql`
  directive @createdAt on FIELD_DEFINITION
`;
