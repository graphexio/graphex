import { printType, validateSchema } from 'graphql';
import gql from 'graphql-tag';
import AMM from '../src';
import { AMOptions } from '../src/definitions';

const generateSchema = (typeDefs, options?: AMOptions) => {
  return new AMM({ options }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs,
  });
};

describe('orderBy', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      pinnedComment: Comment
      comments: [Comment!]
    }

    type Comment @embedded {
      message: String
    }
  `);

  const orderByType = schema.getType('PostOrderByInput');

  test('schema', () => {
    expect(printType(orderByType)).toMatchInlineSnapshot(`
              "enum PostOrderByInput {
                id_ASC
                id_DESC
                title_ASC
                title_DESC
              }"
            `);
  });

  test('values', () => {
    expect(orderByType.toConfig()).toMatchInlineSnapshot(`
      Object {
        "astNode": undefined,
        "description": undefined,
        "extensionASTNodes": Array [],
        "extensions": undefined,
        "name": "PostOrderByInput",
        "values": Object {
          "id_ASC": Object {
            "astNode": undefined,
            "deprecationReason": undefined,
            "description": undefined,
            "extensions": undefined,
            "value": Object {
              "_id": 1,
            },
          },
          "id_DESC": Object {
            "astNode": undefined,
            "deprecationReason": undefined,
            "description": undefined,
            "extensions": undefined,
            "value": Object {
              "_id": -1,
            },
          },
          "title_ASC": Object {
            "astNode": undefined,
            "deprecationReason": undefined,
            "description": undefined,
            "extensions": undefined,
            "value": Object {
              "title": 1,
            },
          },
          "title_DESC": Object {
            "astNode": undefined,
            "deprecationReason": undefined,
            "description": undefined,
            "extensions": undefined,
            "value": Object {
              "title": -1,
            },
          },
        },
      }
    `);
  });
});

describe('where', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      status: String @readonly
    }
  `);

  const postWhereInputType = schema.getType('PostWhereInput');

  test('schema', () => {
    expect(printType(postWhereInputType)).toMatchInlineSnapshot(`
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
        status_exists: Boolean
        status_in: [String]
        status_not_in: [String]
        status: String
        status_lt: String
        status_lte: String
        status_gt: String
        status_gte: String
        status_not: String
        status_contains: String
        status_starts_with: String
        status_ends_with: String
      }"
    `);
  });
});

describe('create', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      pinnedComment: Comment
      comments: [Comment!]
      status: String @readonly
    }

    type Comment @embedded {
      message: String
      user: User @relation
    }

    type User @model {
      id: ID @id @unique @db(name: "_id")
      username: String
    }
  `);

  test('PostCreateInput', () => {
    expect(printType(schema.getType('PostCreateInput'))).toMatchInlineSnapshot(`
                "input PostCreateInput {
                  title: String
                  pinnedComment: CommentCreateOneNestedInput
                  comments: CommentCreateManyNestedInput
                }"
        `);
  });

  test('CommentCreateOneNestedInput', () => {
    expect(printType(schema.getType('CommentCreateOneNestedInput')))
      .toMatchInlineSnapshot(`
                  "input CommentCreateOneNestedInput {
                    create: CommentCreateInput
                  }"
          `);
  });

  test('CommentCreateManyNestedInput', () => {
    expect(printType(schema.getType('CommentCreateManyNestedInput')))
      .toMatchInlineSnapshot(`
                "input CommentCreateManyNestedInput {
                  create: [CommentCreateInput]
                }"
          `);
  });

  test('CommentCreateInput', () => {
    expect(printType(schema.getType('CommentCreateInput')))
      .toMatchInlineSnapshot(`
                "input CommentCreateInput {
                  message: String
                  user: UserCreateOneRelationInput
                }"
          `);
  });

  test('UserCreateOneRelationInput', () => {
    expect(printType(schema.getType('UserCreateOneRelationInput')))
      .toMatchInlineSnapshot(`
                  "input UserCreateOneRelationInput {
                    create: UserCreateInput
                    connect: UserWhereUniqueInput
                  }"
          `);
  });

  test('UserCreateInput', () => {
    expect(printType(schema.getType('UserCreateInput'))).toMatchInlineSnapshot(`
                "input UserCreateInput {
                  username: String
                }"
        `);
  });

  test('UserWhereUniqueInput', () => {
    expect(printType(schema.getType('UserWhereUniqueInput')))
      .toMatchInlineSnapshot(`
                "input UserWhereUniqueInput {
                  id: ID
                }"
        `);
  });
});

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
      profile: Profile
    }

    interface Profile @inherit @embedded {
      invitedBy: User @relation
    }

    type Admin implements User {
      username: String
      profile: AdminProfile
    }

    type AdminProfile implements Profile @embedded {
      name: String
    }

    type Subscriber implements User {
      profile: SubscriberProfile
    }

    type SubscriberProfile implements Profile @embedded {
      name: String
    }

    type Manager implements User {
      username: String
    }
  `);

  test('Query', () => {
    expect(printType(schema.getQueryType())).toMatchInlineSnapshot(`
    "type Query {
      posts(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, first: Int): [Post!]!
      post(where: PostWhereUniqueInput): Post
      postsConnection(where: PostWhereInput, skip: Int, first: Int): PostConnection
      users(where: UserInterfaceWhereInput, orderBy: UserOrderByInput, skip: Int, first: Int): [User!]!
      user(where: UserInterfaceWhereUniqueInput): User
      usersConnection(where: UserInterfaceWhereInput, skip: Int, first: Int): UserConnection
      admins(where: AdminWhereInput, orderBy: AdminOrderByInput, skip: Int, first: Int): [Admin!]!
      admin(where: AdminWhereUniqueInput): Admin
      adminsConnection(where: AdminWhereInput, skip: Int, first: Int): AdminConnection
      subscribers(where: SubscriberWhereInput, orderBy: SubscriberOrderByInput, skip: Int, first: Int): [Subscriber!]!
      subscriber(where: SubscriberWhereUniqueInput): Subscriber
      subscribersConnection(where: SubscriberWhereInput, skip: Int, first: Int): SubscriberConnection
      managers(where: ManagerWhereInput, orderBy: ManagerOrderByInput, skip: Int, first: Int): [Manager!]!
      manager(where: ManagerWhereUniqueInput): Manager
      managersConnection(where: ManagerWhereInput, skip: Int, first: Int): ManagerConnection
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
        likes(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, first: Int): [User]!
        owner(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, first: Int): User
        likesConnection(where: UserWhereInput, skip: Int, first: Int): UserConnection
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

describe('update', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      pinnedComment: Comment
      comments: [Comment!]
      status: String @readonly
    }

    type Comment @embedded {
      message: String
      user: User @relation
    }

    type User @model {
      id: ID @id @unique @db(name: "_id")
      username: String
    }
  `);

  test('PostUpdateInput', () => {
    expect(printType(schema.getType('PostUpdateInput'))).toMatchInlineSnapshot(`
                  "input PostUpdateInput {
                    title: String
                    pinnedComment: CommentUpdateOneNestedInput
                    comments: CommentUpdateManyNestedInput
                  }"
            `);
  });

  test('CommentUpdateOneNestedInput', () => {
    expect(printType(schema.getType('CommentUpdateOneNestedInput')))
      .toMatchInlineSnapshot(`
                  "input CommentUpdateOneNestedInput {
                    create: CommentCreateInput
                    update: CommentUpdateInput
                  }"
            `);
  });

  test('CommentUpdateManyNestedInput', () => {
    expect(printType(schema.getType('CommentUpdateManyNestedInput')))
      .toMatchInlineSnapshot(`
                  "input CommentUpdateManyNestedInput {
                    create: [CommentCreateInput]
                    recreate: [CommentCreateInput]
                    updateMany: [CommentUpdateWithWhereNestedInput]
                    deleteMany: [CommentWhereInput]
                  }"
            `);
  });
});

describe('modelFields', () => {
  test('full schema', () => {
    const schema = generateSchema(gql`
      type Post @model {
        id: ID @id @unique
        title: String
      }
    `);

    const queryStr = printType(schema.getQueryType());
    const mutationStr = printType(schema.getMutationType());

    //TODO: add pagination
    //postsPaged(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, first: Int): PostPagination!

    expect(queryStr).toMatchInlineSnapshot(`
      "type Query {
        posts(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, first: Int): [Post!]!
        post(where: PostWhereUniqueInput): Post
        postsConnection(where: PostWhereInput, skip: Int, first: Int): PostConnection
      }"
    `);

    expect(mutationStr).toMatchInlineSnapshot(`
            "type Mutation {
              createPost(data: PostCreateInput!): Post
              deletePost(where: PostWhereUniqueInput!): Post
              deletePosts(where: PostWhereInput!): Int!
              updatePost(data: PostUpdateInput!, where: PostWhereUniqueInput!): Post
            }"
        `);

    expect(printType(schema.getType('PostConnection'))).toMatchInlineSnapshot(`
        "type PostConnection {
          aggregate: AggregatePost
        }"
      `);

    expect(printType(schema.getType('AggregatePost'))).toMatchInlineSnapshot(`
      "type AggregatePost {
        count: Int!
      }"
    `);
  });
});

describe('abstract', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      likes: [User] @relation
      owner: User @relation
    }

    interface User @inherit @abstract {
      id: ID @id @unique @db(name: "_id")
    }

    type Admin implements User @model {
      username: String
    }

    type Subscriber implements User @model {
      profile: SubscriberProfile
    }

    type SubscriberProfile @embedded {
      name: String
    }
  `);

  test('PostUpdateInput', () => {
    expect(printType(schema.getType('PostUpdateInput'))).toMatchInlineSnapshot(`
                 "input PostUpdateInput {
                   title: String
                   likes: UserUpdateManyRelationInput
                   owner: UserUpdateOneRelationInput
                 }"
            `);
  });

  test('UserUpdateManyRelationInput', () => {
    expect(printType(schema.getType('UserUpdateManyRelationInput')))
      .toMatchInlineSnapshot(`
"input UserUpdateManyRelationInput {
  create: [UserInterfaceCreateInput]
  recreate: [UserInterfaceCreateInput]
  connect: [UserInterfaceWhereUniqueInput]
  connectOnce: [UserInterfaceWhereUniqueInput]
  reconnect: [UserInterfaceWhereUniqueInput]
  disconnect: [UserInterfaceWhereUniqueInput]
  delete: [UserInterfaceWhereUniqueInput]
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
}"
`);
  });
});

describe('empty', () => {
  const schema = generateSchema(gql`
    type Empty @model {
      title: String
    }
  `);

  test('Query', () => {
    expect(printType(schema.getQueryType())).toMatchInlineSnapshot(`
            "type Query {
              empties(where: EmptyWhereInput, orderBy: EmptyOrderByInput, skip: Int, first: Int): [Empty!]!
              empty: Empty
              emptiesConnection(where: EmptyWhereInput, skip: Int, first: Int): EmptyConnection
            }"
          `);
  });
});

describe('aclWhere', () => {
  const schema = generateSchema(
    gql`
      type Post @model {
        id: ID @id @unique @db(name: "_id")
        title: String
        pinnedComment: Comment
        comments: [Comment!]
      }

      type Comment @embedded {
        message: String
      }
    `,
    { aclWhere: true }
  );

  test('PostWhereUniqueInput', () => {
    expect(printType(schema.getType('PostWhereUniqueInput')))
      .toMatchInlineSnapshot(`
        "input PostWhereUniqueInput {
          aclWhere: PostWhereACLInput
          id: ID
        }"
    `);
  });

  test('PostWhereInput', () => {
    expect(printType(schema.getType('PostWhereInput'))).toMatchInlineSnapshot(`
      "input PostWhereInput {
        aclWhere: PostWhereACLInput
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
        pinnedComment_exists: Boolean
        pinnedComment_in: [CommentWhereCleanInput]
        pinnedComment_not_in: [CommentWhereCleanInput]
        pinnedComment: CommentWhereInput
        comments_size: Int
        comments_not_size: Int
        comments_exists: Boolean
        comments_all: [CommentWhereCleanInput]
        comments_exact: [CommentWhereCleanInput]
        comments_in: [CommentWhereCleanInput]
        comments_not_in: [CommentWhereCleanInput]
        comments_some: CommentWhereInput
      }"
    `);
  });
});

describe('default', () => {
  const schema = generateSchema(
    gql`
      type Post @model {
        id: ID @id @unique @db(name: "_id")
        message: String! @default(value: "New post")
      }
    `
  );

  test('PostCreateInput', () => {
    expect(printType(schema.getType('PostCreateInput'))).toMatchInlineSnapshot(`
        "input PostCreateInput {
          message: String
        }"
    `);
  });
});

describe('nested arrays', () => {
  const schema = generateSchema(
    gql`
      type Post @model {
        id: ID @id @unique @db(name: "_id")
        comments: [Comment]
      }

      type Comment @embedded {
        message: String
      }

      interface Review @inherit @embedded {
        message: String
      }

      type HotelReview implements Review {
        rating: Int
      }

      interface Poi @inherit @model {
        id: ID @id @unique @db(name: "_id")
        reviews: [Review] @noArrayFilter #disable interface filters due to https://github.com/graphql/graphql-spec/issues/629
      }

      type Hotel implements Poi {
        title: String
        reviews: [HotelReview]
      }
    `
  );

  test('validate', () => {
    expect(validateSchema(schema)).toMatchObject([]);
  });

  test('Post', () => {
    expect(printType(schema.getType('Post'))).toMatchInlineSnapshot(`
          "type Post {
            id: ID
            comments(where: CommentWhereInput, orderBy: CommentOrderByInput, skip: Int, first: Int): [Comment]
          }"
    `);
  });

  test('Poi', () => {
    expect(printType(schema.getType('Poi'))).toMatchInlineSnapshot(`
    "interface Poi {
      id: ID
      reviews: [Review]
    }"
`);
  });

  test('Hotel', () => {
    expect(printType(schema.getType('Hotel'))).toMatchInlineSnapshot(`
"type Hotel implements Poi {
  id: ID
  reviews(where: HotelReviewWhereInput, orderBy: HotelReviewOrderByInput, skip: Int, first: Int): [HotelReview]
  title: String
}"
`);
  });
});

describe('aggregation', () => {
  const schema = generateSchema(
    gql`
      type Dish @model {
        id: ID @id @unique @db(name: "_id")
        title: String
        price: Float!
        details: DishDetails
      }

      type DishDetails @embedded {
        weight: Float
      }
    `
  );

  test('AggregateDish', () => {
    expect(printType(schema.getType('AggregateDish'))).toMatchInlineSnapshot(`
"type AggregateDish {
  count: Int!
  sum: AggregateNumericFieldsInDish
  min: AggregateNumericFieldsInDish
  max: AggregateNumericFieldsInDish
}"
`);
  });

  test('AggregateNumericFieldsInDish', () => {
    expect(printType(schema.getType('AggregateNumericFieldsInDish')))
      .toMatchInlineSnapshot(`
"type AggregateNumericFieldsInDish {
  price: Float
  details: AggregateNumericFieldsInDishDetails
}"
`);
  });
});
