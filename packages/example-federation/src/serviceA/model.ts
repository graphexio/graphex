import gql from 'graphql-tag';
export default gql`
  directive @external on FIELD_DEFINITION

  type Api {
    id: ObjectID @unique @external
  }

  type Collection @model {
    id: ObjectID @id @unique @db(name: "_id")
    title: String
    apis: [Api] @subdocument
  }
`;
