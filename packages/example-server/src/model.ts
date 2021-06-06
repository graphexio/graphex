import gql from 'graphql-tag';
export default gql`
  interface Node @inherit {
    id: ObjectID! @id @unique @db(name: "_id")
  }

  interface Timestamp @inherit {
    createdAt: Date @createdAt @db(name: "created_at")
    updatedAt: Date @updatedAt
  }

  type Category implements Node & Timestamp @model {
    title: String @unique
    parentCategory: Category @relation(storeField: "parentCategoryId")
    subcategories: [Category!] @extRelation(storeField: "parentCategoryId")
    posts: [Post!] @extRelation
  }

  type Post implements Node & Timestamp @model {
    title: String!
    body: String!
    category: Category @relation
    keywords: [String!]
    owner: User! @relation
  }

  interface User @implements(name: "Node & Timestamp") @inherit @model {
    username: String! @unique
  }

  enum AdminAccess {
    owner
    moderator
  }

  type Admin implements User {
    access: AdminAccess
  }

  enum SubscriberPlan {
    free
    standard
    premium
  }

  type SubscriberProfile {
    firstName: String
    lastName: String
  }

  type Subscriber implements User {
    plan: SubscriberPlan!
    profile: SubscriberProfile @subdocument
  }
`;
