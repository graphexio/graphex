import gql from 'graphql-tag';

export const typeDef = gql`
  directive @updatedAt on FIELD_DEFINITION
`;
