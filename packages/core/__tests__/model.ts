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

  enum HighlightColor {
    red
    green
    blue
  }

  type Comment {
    body: String
    user: User! @relation
    color: HighlightColor
    tags: [String]
  }

  type Post implements Node & Timestamp @model {
    title: String!
    body: String!
    category: Category @relation
    keywords: [String!]
    owner: User! @relation(storeField: "ownerUserId")
    likes: [User] @relation
    comments: [Comment!] @subdocument
    poi: Poi @relation
    pois: [Poi] @relation(storeField: "poiIds")
  }

  interface User @implements(name: "Node & Timestamp") @inherit @model {
    username: String! @unique
    lastPost: Post @extRelation(storeField: "ownerUserId")
    profile: Profile
  }

  interface Profile @inherit {
    invitedBy: User @relation
  }

  enum AdminRole {
    superadmin
    moderator
  }

  type Admin implements User {
    role: AdminRole
    profile: AdminProfile @subdocument
  }
  type AdminProfile implements Profile {
    name: String
  }

  enum SubscriberRole {
    free
    standard
    premium
  }

  type SubscriberProfile implements Profile {
    firstName: String!
    lastName: String!
  }

  type Subscriber implements User {
    role: SubscriberRole
    profile: SubscriberProfile! @subdocument
    name: String @db(name: "profile.firstName") @readonly
  }

  interface Poi @implements(name: "Node & Timestamp") @inherit @abstract {
    title: String
  }

  type Shop implements Poi @model
  type Hotel implements Poi @model {
    stars: Int
  }

  enum PetType {
    cat
    dog
  }

  interface Pet
    @implements(name: "Node & Timestamp")
    @discriminator(value: "type")
    @inherit
    @model {
    id: ID @id
    type: PetType @db(name: "type") @readonly
    name: String
  }

  type PetCat implements Pet @discriminator(value: "cat")
  type PetDog implements Pet @discriminator(value: "dog")
`;
