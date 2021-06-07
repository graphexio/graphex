import gql from 'graphql-tag';
export default gql`
  type Api @model {
    id: ObjectID @id @unique @db(name: "_id")
    title: String
  }
`;
