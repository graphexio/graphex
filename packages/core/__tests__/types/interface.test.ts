import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('interface', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      likes: [User]! @relation
      owner: User @relation
    }

    interface User @model @inherit {
      id: ID @id @unique @db(name: "_id")
      profile: Profile @subdocument
    }

    interface Profile @inherit {
      invitedBy: User @relation
    }

    type Admin implements User {
      username: String
      profile: AdminProfile @subdocument
    }

    type AdminProfile implements Profile {
      name: String
    }

    type Subscriber implements User {
      profile: SubscriberProfile @subdocument
    }

    type SubscriberProfile implements Profile {
      name: String
    }

    type Manager implements User {
      username: String
    }
  `);

  test('Query', () => {
    expect(printType(schema.getQueryType())).toMatchInlineSnapshot(`
"type Query {
  posts(where: PostWhereInput, orderBy: PostOrderByInput, offset: Int, first: Int): [Post!]!
  post(where: PostWhereUniqueInput): Post
  postsConnection(where: PostWhereInput, orderBy: PostOrderByInput, offset: Int, first: Int): PostConnection
  users(where: UserInterfaceWhereInput, orderBy: UserOrderByInput, offset: Int, first: Int): [User!]!
  user(where: UserInterfaceWhereUniqueInput): User
  usersConnection(where: UserInterfaceWhereInput, orderBy: UserOrderByInput, offset: Int, first: Int): UserConnection
  admins(where: AdminWhereInput, orderBy: AdminOrderByInput, offset: Int, first: Int): [Admin!]!
  admin(where: AdminWhereUniqueInput): Admin
  adminsConnection(where: AdminWhereInput, orderBy: AdminOrderByInput, offset: Int, first: Int): AdminConnection
  subscribers(where: SubscriberWhereInput, orderBy: SubscriberOrderByInput, offset: Int, first: Int): [Subscriber!]!
  subscriber(where: SubscriberWhereUniqueInput): Subscriber
  subscribersConnection(where: SubscriberWhereInput, orderBy: SubscriberOrderByInput, offset: Int, first: Int): SubscriberConnection
  managers(where: ManagerWhereInput, orderBy: ManagerOrderByInput, offset: Int, first: Int): [Manager!]!
  manager(where: ManagerWhereUniqueInput): Manager
  managersConnection(where: ManagerWhereInput, orderBy: ManagerOrderByInput, offset: Int, first: Int): ManagerConnection
}"
`);
  });
  test('Mutation', () => {
    expect(printType(schema.getMutationType())).toMatchInlineSnapshot(`
"type Mutation {
  createPost(data: PostCreateInput!): Post
  deletePost(where: PostWhereUniqueInput!): Post
  deletePosts(where: PostWhereInput!): Int!
  updatePost(data: PostUpdateInput!, where: PostWhereUniqueInput!): Post
  createUser(data: UserInterfaceCreateInput!): User
  deleteUser(where: UserInterfaceWhereUniqueInput!): User
  deleteUsers(where: UserInterfaceWhereInput!): Int!
  updateUser(data: UserUpdateInput!, where: UserInterfaceWhereUniqueInput!): User
  createAdmin(data: AdminCreateInput!): Admin
  deleteAdmin(where: AdminWhereUniqueInput!): Admin
  deleteAdmins(where: AdminWhereInput!): Int!
  updateAdmin(data: AdminUpdateInput!, where: AdminWhereUniqueInput!): Admin
  createSubscriber(data: SubscriberCreateInput!): Subscriber
  deleteSubscriber(where: SubscriberWhereUniqueInput!): Subscriber
  deleteSubscribers(where: SubscriberWhereInput!): Int!
  updateSubscriber(data: SubscriberUpdateInput!, where: SubscriberWhereUniqueInput!): Subscriber
  createManager(data: ManagerCreateInput!): Manager
  deleteManager(where: ManagerWhereUniqueInput!): Manager
  deleteManagers(where: ManagerWhereInput!): Int!
  updateManager(data: ManagerUpdateInput!, where: ManagerWhereUniqueInput!): Manager
}"
`);
  });

  test('Post', () => {
    expect(printType(schema.getType('Post'))).toMatchInlineSnapshot(`
"type Post {
  id: ID
  title: String
  likes(where: UserWhereInput, orderBy: UserOrderByInput, offset: Int, first: Int): [User]!
  owner(where: UserWhereInput, orderBy: UserOrderByInput, offset: Int, first: Int): User
  likesConnection(where: UserWhereInput, offset: Int, first: Int): UserConnection
}"
`);
  });

  test('PostWhereInput', () => {
    expect(printType(schema.getType('PostWhereInput'))).toMatchInlineSnapshot(`
"input PostWhereInput {
  AND: [PostWhereInput]
  OR: [PostWhereInput]
  id_exists: Boolean
  id_in: [ID]
  id_not_in: [ID]
  id: ID
  id_not: ID
  title_exists: Boolean
  title_in: [String]
  title_not_in: [String]
  title: String
  title_lt: String
  title_lte: String
  title_gt: String
  title_gte: String
  title_not: String
  title_contains: String
  title_starts_with: String
  title_ends_with: String
  likes_size: Int
  likes_not_size: Int
  likes_exists: Boolean
  likes_all: [UserWhereCleanInput]
  likes_exact: [UserWhereCleanInput]
  likes_not_in: [UserWhereCleanInput]
  likes_some: UserInterfaceWhereInput
  likes: UserInterfaceWhereInput
  owner_exists: Boolean
  owner_not_in: [UserWhereCleanInput]
  owner: UserInterfaceWhereInput
  likesConnection_exists: Boolean
  likesConnection_in: [UserConnectionWhereCleanInput]
  likesConnection_not_in: [UserConnectionWhereCleanInput]
  likesConnection: UserConnectionWhereInput
}"
`);
  });

  test('UserWhereInput', () => {
    expect(printType(schema.getType('UserWhereInput'))).toMatchInlineSnapshot(`
       "input UserWhereInput {
         AND: [UserWhereInput]
         OR: [UserWhereInput]
         id_exists: Boolean
         id_in: [ID]
         id_not_in: [ID]
         id: ID
         id_not: ID
         profile_exists: Boolean
         profile: ProfileInterfaceWhereInput
       }"
    `);
  });

  test('ProfileInterfaceWhereInput', () => {
    expect(printType(schema.getType('ProfileInterfaceWhereInput')))
      .toMatchInlineSnapshot(`
"input ProfileInterfaceWhereInput {
  aclWhere: ProfileWhereACLInput
  Profile: ProfileWhereInput
  AdminProfile: AdminProfileWhereInput
  SubscriberProfile: SubscriberProfileWhereInput
}"
`);
  });

  test('UserCreateOneRelationInput', () => {
    expect(printType(schema.getType('UserCreateOneRelationInput')))
      .toMatchInlineSnapshot(`
                  "input UserCreateOneRelationInput {
                    create: UserInterfaceCreateInput
                    connect: UserInterfaceWhereUniqueInput
                  }"
            `);
  });

  test('UserCreateManyRelationInput', () => {
    expect(printType(schema.getType('UserCreateManyRelationInput')))
      .toMatchInlineSnapshot(`
                  "input UserCreateManyRelationInput {
                    create: [UserInterfaceCreateInput]
                    connect: [UserInterfaceWhereUniqueInput]
                  }"
            `);
  });

  test('UserInterfaceCreateInput', () => {
    expect(printType(schema.getType('UserInterfaceCreateInput')))
      .toMatchInlineSnapshot(`
            "input UserInterfaceCreateInput {
              Admin: AdminCreateInput
              Subscriber: SubscriberCreateInput
              Manager: ManagerCreateInput
            }"
        `);
  });

  test('UserInterfaceWhereInput', () => {
    expect(printType(schema.getType('UserInterfaceWhereInput')))
      .toMatchInlineSnapshot(`
            "input UserInterfaceWhereInput {
              aclWhere: UserWhereACLInput
              User: UserWhereInput
              Admin: AdminWhereInput
              Subscriber: SubscriberWhereInput
              Manager: ManagerWhereInput
            }"
        `);
  });

  test('UserInterfaceWhereUniqueInput', () => {
    expect(printType(schema.getType('UserInterfaceWhereUniqueInput')))
      .toMatchInlineSnapshot(`
"input UserInterfaceWhereUniqueInput {
  aclWhere: UserWhereACLInput
  User: UserWhereUniqueInput
  Admin: AdminWhereUniqueInput
  Subscriber: SubscriberWhereUniqueInput
  Manager: ManagerWhereUniqueInput
}"
`);
  });

  test('ManagerCreateInput', () => {
    expect(printType(schema.getType('ManagerCreateInput')))
      .toMatchInlineSnapshot(`
            "input ManagerCreateInput {
              profile: ProfileCreateOneNestedInput
              username: String
            }"
        `);
  });

  test('ProfileCreateOneNestedInput', () => {
    expect(printType(schema.getType('ProfileCreateOneNestedInput')))
      .toMatchInlineSnapshot(`
            "input ProfileCreateOneNestedInput {
              create: ProfileInterfaceCreateInput
            }"
        `);
  });
});
