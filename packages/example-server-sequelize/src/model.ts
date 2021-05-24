import gql from 'graphql-tag';
export default gql`
  interface Node @inherit {
    id: Int! @id @unique
  }

  interface Timestamp @inherit {
    createdAt: Date @createdAt
    updatedAt: Date @updatedAt
  }

  type User implements Node & Timestamp @model(collection: "User") {
    username: String! @unique
    posts: [Post] @extRelation(storeField: "owner_id", field: "id", many: true)
  }

  type Post implements Node & Timestamp @model(collection: "Post") {
    title: String
    body: String
    owner: User @relation(storeField: "owner_id", field: "id")
    likes: [User] @relation(storeField: "like_ids", field: "id")
  }
`;
