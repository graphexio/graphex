import gql from 'graphql-tag';
export default gql`
  type Api @federated {
    id: ObjectID @unique @external
  }

  type Collection @model {
    id: ObjectID @id @unique @db(name: "_id")
    title: String
    apis: [Api] @relationOutside
  }
`;
