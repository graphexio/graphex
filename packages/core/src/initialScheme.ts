import gql from 'graphql-tag';
export default gql`
  type Query
  type Mutation
  type Cursor {
    first: Int!
    skip: Int!
  }
`;
