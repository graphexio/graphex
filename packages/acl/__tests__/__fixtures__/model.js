import gql from 'graphql-tag';
export default gql`
  interface Node @inherit {
    id: ObjectID! @id @unique @db(name: "_id")
  }

  interface Timestamp @inherit {
    createdAt: Date @createdAt
    updatedAt: Date @updatedAt
  }

  type Category implements Node & Timestamp @model {
    title: String @unique
    parentCategory: Category @relation(storeField: "parentCategoryId")
    subcategories: [Category!] @extRelation(storeField: "parentCategoryId")
    posts: [Post!] @extRelation
  }

  type Comment @embedded {
    body: String
    user: User! @relation
  }

  type Post implements Node & Timestamp @model {
    title: String!
    body: String!
    category: Category @relation
    keywords: [String!]
    owner: User! @relation
    place: GeoJSONPoint
    comments: [Comment!]
    poi: Poi @relation
    pois: [Poi] @relation
  }

  interface User @inherit @model {
    username: String! @unique
  }

  enum AdminRole {
    superadmin
    moderator
  }

  type Admin implements Node & Timestamp & User {
    role: AdminRole
  }

  enum SubscriberRole {
    free
    standard
    premium
  }

  type SubscriberProfile @embedded {
    firstName: String!
    lastName: String!
  }

  type Subscriber implements Node & Timestamp & User {
    role: SubscriberRole
    profile: SubscriberProfile!
  }

  interface Poi @inherit @abstract {
    title: String
  }

  type Shop implements Node & Timestamp & Poi @model
  type Hotel implements Node & Timestamp & Poi @model {
    stars: Int
  }
`;
