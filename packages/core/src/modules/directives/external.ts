import gql from 'graphql-tag';

export const typeDef = gql`
  directive @external on FIELD_DEFINITION
`;
