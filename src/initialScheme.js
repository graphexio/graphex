import gql from 'graphql-tag';
export default gql`
  type Query
  type Mutation

  type _QueryMeta {
    count: Int!
  }
`;
