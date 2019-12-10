import gql from 'graphql-tag';
export default gql`
  interface Node @inherit {
    id: ObjectID! @id @unique @db(name: "_id")
  }

  interface Timestamp @inherit {
    createdAt: Date @createdAt @db(name: "created_at")
    updatedAt: Date @updatedAt
  }

  type Poi implements Node & Timestamp @model {
    title: String
    place: GeoJSONPoint
  }
`;
