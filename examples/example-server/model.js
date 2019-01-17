import gql from 'graphql-tag';
export default gql`
  type Category @model {
    id: ObjectID! @id @unique @db(name: "_id")
    title: String
    parentCategory: Category @relation(storeField: "parentCategoryId")
    subcategories: [Category!] @extRelation(storeField: "parentCategoryId")
    posts: [Post!] @extRelation
  }

  type Comment {
    body: String
    user: User! @relation
  }

  type Post @model {
    id: ObjectID! @id @unique @db(name: "_id")
    title: String!
    body: String!
    category: Category @relation
    keywords: [String!]
    owner: User! @relation
    place: GeoJSONPoint
    comments: [Comment!]
  }

  interface User @inherit @model {
    id: ObjectID! @id @unique @db(name: "_id")
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

  type SubscriberProfile {
    firstName: String!
    lastName: String!
  }

  type Subscriber implements User {
    role: SubscriberRole
    profile: SubscriberProfile!
  }
`;
