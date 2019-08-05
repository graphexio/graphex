import gql from 'graphql-tag';
export default gql`
  type Query @initInputTypes
  type Mutation
  type Cursor {
    first: Int!
    skip: Int!
  }
`;
