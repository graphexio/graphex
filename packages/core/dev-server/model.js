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
    pois: [Poi] @relation(storeField: "poiIds")
  }

  scalar _FieldSet
  directive @key(fields: _FieldSet!) on OBJECT | INTERFACE

  interface User @implements(name: "Node & Timestamp") @inherit @model {
    username: String! @unique
  }

  enum AdminRole {
    superadmin
    moderator
  }

  type Admin implements User {
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

  type Subscriber implements User {
    role: SubscriberRole
    profile: SubscriberProfile!
  }

  interface Poi @implements(name: "Node & Timestamp") @inherit @abstract {
    title: String
  }

  type Shop implements Poi @model
  type Hotel implements Poi @model {
    stars: Int
  }
`;
