jest.setTimeout(20000);

import prepare from './integration-prepare';
const testInstance = prepare();
const { query, mutate, mongod, connectToDatabase } = testInstance.start();

const _ = require('lodash');
import gql from 'graphql-tag';
import { getIntrospectionQuery } from 'graphql';

beforeAll(async () => {
  let DB = await connectToDatabase();
  DB.collection('posts').createIndex({ place: '2dsphere' });
});

afterAll(async () => {
  testInstance.stop();
});

test('Introspection', async () => {
  const { errors, data } = await query({
    query: getIntrospectionQuery(),
  });
  expect(errors).toBeUndefined();
});

test('QueryCategories empty', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        categories {
          title
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [],
    }
  `);
});

test('Empty WhereUnique', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        category(where: {}) {
          title
        }
      }
    `,
    variables: {},
  });
  expect(errors).toMatchInlineSnapshot(`
    Array [
      Object {
        "extensions": Object {
          "code": "BAD_USER_INPUT",
        },
        "locations": Array [
          Object {
            "column": 3,
            "line": 2,
          },
        ],
        "message": "WhereUniqueType cannot be empty",
        "path": Array [
          "category",
        ],
      },
    ]
  `);
});

test('CreateCategory', async () => {
  let { errors, data } = await mutate({
    mutation: gql`
      mutation createCategory($title: String) {
        createCategory(data: { title: $title }) {
          title
        }
      }
    `,
    variables: { title: 'root' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "createCategory": Object {
        "title": "root",
      },
    }
  `);
});

test('QuerySingleCategory', async () => {
  let { errors, data } = await query({
    query: gql`
      {
        category(where: { title: "root" }) {
          title
        }
      }
    `,
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "category": Object {
        "title": "root",
      },
    }
  `);
});

test('QueryCategories after create', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        categories {
          title
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "root",
        },
      ],
    }
  `);
});

test('CreateChildCategory "JS"', async () => {
  let { errors, data } = await mutate({
    mutation: gql`
      mutation createChildCategory($title: String!, $parentTitle: String!) {
        createCategory(
          data: {
            title: $title
            parentCategory: { connect: { title: $parentTitle } }
          }
        ) {
          title
          parentCategory {
            title
          }
        }
      }
    `,
    variables: { title: 'JS', parentTitle: 'root' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "createCategory": Object {
        "parentCategory": Object {
          "title": "root",
        },
        "title": "JS",
      },
    }
  `);
});

test('CreateChildCategory "MongoDB"', async () => {
  let { errors, data } = await mutate({
    mutation: gql`
      mutation createChildCategory($title: String!, $parentTitle: String!) {
        createCategory(
          data: {
            title: $title
            parentCategory: { connect: { title: $parentTitle } }
          }
        ) {
          title
          parentCategory {
            title
          }
        }
      }
    `,
    variables: { title: 'MongoDB', parentTitle: 'root' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "createCategory": Object {
        "parentCategory": Object {
          "title": "root",
        },
        "title": "MongoDB",
      },
    }
  `);
});

test('CreateChildCategory "React"', async () => {
  let { errors, data } = await mutate({
    mutation: gql`
      mutation createChildCategory($title: String!, $parentTitle: String!) {
        createCategory(
          data: {
            title: $title
            parentCategory: { connect: { title: $parentTitle } }
          }
        ) {
          title
          parentCategory {
            title
          }
        }
      }
    `,
    variables: { title: 'React', parentTitle: 'JS' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "createCategory": Object {
        "parentCategory": Object {
          "title": "JS",
        },
        "title": "React",
      },
    }
  `);
});

test('Update category', async () => {
  let { errors, data } = await mutate({
    mutation: gql`
      mutation update($oldTitle: String!, $newTitle: String!) {
        updateCategory(
          where: { title: $oldTitle }
          data: { title: $newTitle }
        ) {
          title
        }
      }
    `,
    variables: { oldTitle: 'JS', newTitle: 'JavaScript' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "updateCategory": Object {
        "title": "JavaScript",
      },
    }
  `);
});

test('Query categories after renaming', async () => {
  let { errors, data } = await query({
    query: gql`
      {
        categories {
          title
        }
      }
    `,
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "root",
        },
        Object {
          "title": "JavaScript",
        },
        Object {
          "title": "MongoDB",
        },
        Object {
          "title": "React",
        },
      ],
    }
  `);
});

test('Query categories pagination', async () => {
  let { errors, data } = await query({
    query: gql`
      {
        categories(skip: 2, first: 1) {
          title
        }
      }
    `,
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "MongoDB",
        },
      ],
    }
  `);
});

test('Rename category back', async () => {
  let { errors, data } = await mutate({
    mutation: gql`
      mutation update($oldTitle: String!, $newTitle: String!) {
        updateCategory(
          where: { title: $oldTitle }
          data: { title: $newTitle }
        ) {
          title
        }
      }
    `,
    variables: { oldTitle: 'JavaScript', newTitle: 'JS' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "updateCategory": Object {
        "title": "JS",
      },
    }
  `);
});

test('Query Category with parent relation', async () => {
  let { errors, data } = await query({
    query: gql`
      {
        category(where: { title: "JS" }) {
          title
          parentCategory {
            title
          }
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "category": Object {
        "parentCategory": Object {
          "title": "root",
        },
        "title": "JS",
      },
    }
  `);
});

test('QueryCategoriesExtRelation', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        categories {
          title
          subcategories {
            title
            subcategories {
              title
            }
          }
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "subcategories": Array [
            Object {
              "subcategories": Array [
                Object {
                  "title": "React",
                },
              ],
              "title": "JS",
            },
            Object {
              "subcategories": Array [],
              "title": "MongoDB",
            },
          ],
          "title": "root",
        },
        Object {
          "subcategories": Array [
            Object {
              "subcategories": Array [],
              "title": "React",
            },
          ],
          "title": "JS",
        },
        Object {
          "subcategories": Array [],
          "title": "MongoDB",
        },
        Object {
          "subcategories": Array [],
          "title": "React",
        },
      ],
    }
  `);
});

test('Categories aggregate count', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        categoriesConnection {
          aggregate {
            count
          }
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categoriesConnection": Object {
        "aggregate": Object {
          "count": 4,
        },
      },
    }
  `);
});

test('Categories aggregate count with where', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        categoriesConnection(where: { title: "JS" }) {
          aggregate {
            count
          }
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categoriesConnection": Object {
        "aggregate": Object {
          "count": 1,
        },
      },
    }
  `);
});

test('ExtRelation OrderBy', async () => {
  {
    let { errors, data } = await query({
      query: gql`
        query {
          categories(where: { title: "root" }) {
            title
            subcategories(orderBy: createdAt_ASC) {
              title
            }
          }
        }
      `,
      variables: {},
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "subcategories": Array [
            Object {
              "title": "JS",
            },
            Object {
              "title": "MongoDB",
            },
          ],
          "title": "root",
        },
      ],
    }
  `);
  }
  {
    let { errors, data } = await query({
      query: gql`
        query {
          categories(where: { title: "root" }) {
            title
            subcategories(orderBy: createdAt_DESC) {
              title
            }
          }
        }
      `,
      variables: {},
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
      Object {
        "categories": Array [
          Object {
            "subcategories": Array [
              Object {
                "title": "MongoDB",
              },
              Object {
                "title": "JS",
              },
            ],
            "title": "root",
          },
        ],
      }
    `);
  }
});

test('QueryCategoriesByTitle', async () => {
  let { errors, data } = await query({
    query: gql`
      query filterByTitle($title: String) {
        categories(where: { title: $title }) {
          title
        }
      }
    `,
    variables: { title: 'root' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "root",
        },
      ],
    }
  `);
});

test('CategoriesComplexFilterOr', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        categories(where: { OR: [{ title: "root" }, { title: "JS" }] }) {
          title
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "root",
        },
        Object {
          "title": "JS",
        },
      ],
    }
  `);
});

test('CategoriesRelationFilter', async () => {
  let { errors, data } = await query({
    query: gql`
      query subcategories($title: String) {
        categories(where: { parentCategory: { title: $title } }) {
          title
        }
      }
    `,
    variables: { title: 'root' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "JS",
        },
        Object {
          "title": "MongoDB",
        },
      ],
    }
  `);
});

test('CreateSubscriberWithEmbeddedDocument', async () => {
  let { errors, data } = await query({
    query: gql`
      mutation {
        createSubscriber(
          data: {
            username: "subscriber1"
            profile: { create: { firstName: "Gwion", lastName: "Britt" } }
          }
        ) {
          username
          profile {
            firstName
            lastName
          }
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "createSubscriber": Object {
        "profile": Object {
          "firstName": "Gwion",
          "lastName": "Britt",
        },
        "username": "subscriber1",
      },
    }
  `);
});

test('Find users by interface where', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        users(
          where: {
            profile: {
              SubscriberProfile: { firstName: "Gwion", lastName: "Britt" }
            }
          }
        ) {
          ... on Subscriber {
            username
            profile {
              firstName
              lastName
            }
          }
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "users": Array [
        Object {
          "profile": Object {
            "firstName": "Gwion",
            "lastName": "Britt",
          },
          "username": "subscriber1",
        },
      ],
    }
  `);
});

test('Update subscriber nested field', async () => {
  let { data, errors } = await mutate({
    mutation: gql`
      mutation updateSubscribersName($username: String!, $firstName: String!) {
        updateSubscriber(
          data: { profile: { update: { firstName: $firstName } } }
          where: { username: $username }
        ) {
          username
          profile {
            firstName
          }
        }
      }
    `,
    variables: {
      username: 'subscriber1',
      firstName: 'New first name',
    },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "updateSubscriber": Object {
        "profile": Object {
          "firstName": "New first name",
        },
        "username": "subscriber1",
      },
    }
  `);
});

test('Rename subscriber back', async () => {
  let { data, errors } = await mutate({
    mutation: gql`
      mutation updateSubscribersName($username: String!, $firstName: String!) {
        updateSubscriber(
          data: { profile: { update: { firstName: $firstName } } }
          where: { username: $username }
        ) {
          username
          profile {
            firstName
          }
        }
      }
    `,
    variables: {
      username: 'subscriber1',
      firstName: 'Gwion',
    },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "updateSubscriber": Object {
        "profile": Object {
          "firstName": "Gwion",
        },
        "username": "subscriber1",
      },
    }
  `);
});

test('CreateAdmin', async () => {
  let { data, errors } = await query({
    query: gql`
      mutation {
        createAdmin(data: { username: "admin" }) {
          username
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "createAdmin": Object {
        "username": "admin",
      },
    }
  `);
});

let postId = '';
test('CreatePostWithInterfaceRelation', async () => {
  let res = await query({
    query: gql`
      mutation {
        createPost(
          data: {
            title: "Build GraphQL API with Apollo"
            body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            owner: { create: { Admin: { username: "moderator" } } }
            category: { connect: { title: "JS" } }
          }
        ) {
          id
          title
        }
      }
    `,
    variables: {},
  });
  let { data, errors } = res;
  expect(errors).toBeUndefined();
  postId = data.createPost.id;
  delete data.createPost.id;
  expect(data).toMatchInlineSnapshot(`
    Object {
      "createPost": Object {
        "title": "Build GraphQL API with Apollo",
      },
    }
  `);
});

test('Query posts with owner relation', async () => {
  let res = await query({
    query: gql`
      query {
        posts {
          owner {
            username
          }
        }
      }
    `,
    variables: {},
  });
  let { data, errors } = res;
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "posts": Array [
        Object {
          "owner": Object {
            "username": "moderator",
          },
        },
      ],
    }
  `);
});

test('QueryUsersInterface', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        users {
          username
          ... on Admin {
            role
          }
          ... on Subscriber {
            profile {
              firstName
              lastName
            }
          }
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "users": Array [
        Object {
          "profile": Object {
            "firstName": "Gwion",
            "lastName": "Britt",
          },
          "username": "subscriber1",
        },
        Object {
          "role": null,
          "username": "admin",
        },
        Object {
          "role": null,
          "username": "moderator",
        },
      ],
    }
  `);
});

test('CategoriesSameFieldFilter', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        categories(where: { title_gt: "A", title_lt: "L" }) {
          title
        }
      }
    `,
    variables: { title: 'React' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "JS",
        },
      ],
    }
  `);
});

test('CategoriesOrderByFieldWithDBDirective', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        categories(orderBy: createdAt_DESC) {
          title
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "React",
        },
        Object {
          "title": "MongoDB",
        },
        Object {
          "title": "JS",
        },
        Object {
          "title": "root",
        },
      ],
    }
  `);
});

test('CategoryDelete', async () => {
  let { errors, data } = await query({
    query: gql`
      mutation deleteCategory($title: String) {
        deleteCategory(where: { title: $title }) {
          title
        }
      }
    `,
    variables: { title: 'React' },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "deleteCategory": Object {
        "title": "React",
      },
    }
  `);
});

test('QueryCategories after delete', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        categories {
          title
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "root",
        },
        Object {
          "title": "JS",
        },
        Object {
          "title": "MongoDB",
        },
      ],
    }
  `);
});

let shopId = '';
test('CreateShop abstract interface', async () => {
  let { errors, data } = await query({
    query: gql`
      mutation createShop($title: String!) {
        createShop(data: { title: $title }) {
          id
          title
        }
      }
    `,
    variables: { title: 'ifc mall' },
  });
  expect(errors).toBeUndefined();
  shopId = data.createShop.id;
  delete data.createShop.id;

  expect(data).toMatchInlineSnapshot(`
    Object {
      "createShop": Object {
        "title": "ifc mall",
      },
    }
  `);
});

test('QueryShops', async () => {
  let { errors, data } = await query({
    query: gql`
      {
        shops {
          title
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "shops": Array [
        Object {
          "title": "ifc mall",
        },
      ],
    }
  `);
});

test('QueryShopById', async () => {
  let { data, errors } = await query({
    query: gql`
      query shop($id: ObjectID!) {
        shop(where: { id: $id }) {
          title
        }
      }
    `,
    variables: { id: shopId },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "shop": Object {
        "title": "ifc mall",
      },
    }
  `);
});

test('Update Post create abstract relation Hotel ', async () => {
  let { data, errors } = await query({
    query: gql`
      mutation updatePost($postId: ObjectID) {
        updatePost(
          where: { id: $postId }
          data: { pois: { create: { Hotel: { title: "Marriott", stars: 5 } } } }
        ) {
          pois {
            title
          }
        }
      }
    `,
    variables: { postId },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "updatePost": Object {
        "pois": Array [
          Object {
            "title": "Marriott",
          },
        ],
      },
    }
  `);
});

test('QueryHotels', async () => {
  let { errors, data } = await query({
    query: gql`
      {
        hotels {
          title
          stars
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "hotels": Array [
        Object {
          "stars": 5,
          "title": "Marriott",
        },
      ],
    }
  `);
});

test('UpdatePostConnectShop', async () => {
  let { errors, data } = await query({
    query: gql`
      mutation updatePost($postId: ObjectID, $shopId: ObjectID) {
        updatePost(
          where: { id: $postId }
          data: { pois: { connect: { Shop: { id: $shopId } } } }
        ) {
          pois {
            title
          }
        }
      }
    `,
    variables: { postId, shopId },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "updatePost": Object {
        "pois": Array [
          Object {
            "title": "Marriott",
          },
          Object {
            "title": "ifc mall",
          },
        ],
      },
    }
  `);
});

test('UpdatePostDisconnectShop', async () => {
  let { errors, data } = await query({
    query: gql`
      mutation updatePost($postId: ObjectID, $shopId: ObjectID) {
        updatePost(
          where: { id: $postId }
          data: { pois: { disconnect: { Shop: { id: $shopId } } } }
        ) {
          pois {
            title
          }
        }
      }
    `,
    variables: { postId, shopId },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "updatePost": Object {
        "pois": Array [
          Object {
            "title": "Marriott",
          },
        ],
      },
    }
  `);
});

test('UpdatePostConnectShop', async () => {
  let { errors, data } = await query({
    query: gql`
      mutation updatePost($postId: ObjectID, $shopId: ObjectID) {
        updatePost(
          where: { id: $postId }
          data: { pois: { connect: { Shop: { id: $shopId } } } }
        ) {
          pois {
            title
          }
        }
      }
    `,
    variables: { postId, shopId },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "updatePost": Object {
        "pois": Array [
          Object {
            "title": "Marriott",
          },
          Object {
            "title": "ifc mall",
          },
        ],
      },
    }
  `);
});

test('UpdatePostDeleteShop', async () => {
  let { errors, data } = await query({
    query: gql`
      mutation updatePost($postId: ObjectID, $shopId: ObjectID) {
        updatePost(
          where: { id: $postId }
          data: { pois: { delete: { Shop: { id: $shopId } } } }
        ) {
          pois {
            title
          }
        }
      }
    `,
    variables: { postId, shopId },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "updatePost": Object {
        "pois": Array [
          Object {
            "title": "Marriott",
          },
        ],
      },
    }
  `);
});

test('QueryShopById after updates', async () => {
  let { errors, data } = await query({
    query: gql`
      query shop($id: ObjectID!) {
        shop(where: { id: $id }) {
          title
        }
      }
    `,
    variables: { id: shopId },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "shop": null,
    }
  `);
});

test('test empty object instead array', async () => {
  let { data, errors } = await query({
    query: gql`
      mutation {
        createPost(
          data: {
            title: "Empty comments post title"
            body: "Empty comments post body"
            comments: { create: [] }
          }
        ) {
          id
          comments {
            body
          }
        }
      }
    `,
    variables: { shopId },
  });
  expect(errors).toBeUndefined();
});

test('federation entities', async () => {
  let { errors, data } = await query({
    query: gql`
      query($representations: [_Any!]!) {
        _entities(representations: $representations) {
          __typename
          ... on Category {
            title
          }
          ... on Hotel {
            title
          }
        }
      }
    `,
    variables: {
      representations: [
        { __typename: 'Category', title: 'root' },
        { __typename: 'Hotel', title: 'Marriott' },
      ],
    },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "_entities": Array [
        Object {
          "__typename": "Category",
          "title": "root",
        },
        Object {
          "__typename": "Hotel",
          "title": "Marriott",
        },
      ],
    }
  `);
});

test('relation on null item', async () => {
  let { errors, data } = await query({
    query: gql`
      query($representations: [_Any!]!) {
        _entities(representations: $representations) {
          __typename
          ... on Post {
            title
            owner {
              username
            }
          }
        }
      }
    `,
    variables: {
      representations: [
        { __typename: 'Post', title: 'Build GraphQL API with Apollo' },
        { __typename: 'Post', title: 'Never existing post' },
      ],
    },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "_entities": Array [
        Object {
          "__typename": "Post",
          "owner": Object {
            "username": "moderator",
          },
          "title": "Build GraphQL API with Apollo",
        },
        null,
      ],
    }
  `);
});

test('Entities custom scalar inside _Any', async () => {
  let { errors, data } = await query({
    query: gql`
      query($representations: [_Any!]!) {
        _entities(representations: $representations) {
          __typename
          ... on Post {
            title
            owner {
              username
            }
          }
        }
      }
    `,
    variables: {
      representations: [{ __typename: 'Post', id: postId }],
    },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "_entities": Array [
        Object {
          "__typename": "Post",
          "owner": Object {
            "username": "moderator",
          },
          "title": "Build GraphQL API with Apollo",
        },
      ],
    }
  `);
});

test('Test createdAt, updatedAt', async () => {
  let result = await query({
    query: gql`
      mutation {
        createCategory1: createCategory(
          data: {
            title: "Category 1"
            createdAt: "2019-01-01T01:00:00.000Z"
            updatedAt: "2019-01-01T01:00:00.000Z"
          }
        ) {
          title
          createdAt
        }
        createCategory2: createCategory(
          data: {
            title: "Category 2"
            createdAt: "2019-01-02T01:00:00.000Z"
            updatedAt: "2019-01-02T01:00:00.000Z"
          }
        ) {
          title
          createdAt
        }
        createCategory3: createCategory(
          data: {
            title: "Category 3"
            createdAt: "2019-01-03T01:00:00.000Z"
            updatedAt: "2019-01-03T01:00:00.000Z"
          }
        ) {
          title
          createdAt
        }
      }
    `,
  });
  expect(result.errors).toBeUndefined();

  {
    let { errors, data } = await query({
      query: gql`
        query {
          categories(
            where: { createdAt_lte: "2019-01-10T00:00:00.000Z" }
            orderBy: createdAt_ASC
          ) {
            title
            createdAt
          }
        }
      `,
    });

    //Date shouldn't be stored as string

    //check user defined values
    let DB = await connectToDatabase();
    let record = await DB.collection('categories').findOne({
      title: 'Category 1',
    });
    expect(typeof record.created_at).toBe('object');
    expect(typeof record.updatedAt).toBe('object');

    //check automatically defined values
    record = await DB.collection('categories').findOne({
      title: 'root',
    });
    expect(typeof record.created_at).toBe('object');
    expect(typeof record.updatedAt).toBe('object');
    /////////////

    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "createdAt": "2019-01-01T01:00:00.000Z",
          "title": "Category 1",
        },
        Object {
          "createdAt": "2019-01-02T01:00:00.000Z",
          "title": "Category 2",
        },
        Object {
          "createdAt": "2019-01-03T01:00:00.000Z",
          "title": "Category 3",
        },
      ],
    }
  `);
  }
  {
    let { errors, data } = await query({
      query: gql`
        query {
          categories(
            where: { createdAt_gte: "2019-01-10T00:00:00.000Z" }
            orderBy: createdAt_DESC
          ) {
            title
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
    Object {
      "categories": Array [
        Object {
          "title": "MongoDB",
        },
        Object {
          "title": "JS",
        },
        Object {
          "title": "root",
        },
      ],
    }
  `);
  }
});

test('relation some', async () => {
  {
    let { errors, data } = await query({
      query: gql`
        mutation {
          createPost(
            data: {
              title: "Post with likes"
              body: "Post with likes"
              owner: { connect: { User: { username: "admin" } } }
              likes: { connect: [{ User: { username: "admin" } }] }
            }
          ) {
            id
          }
        }
      `,
    });
    expect(errors).toBeUndefined();
  }

  {
    let { errors, data } = await query({
      query: gql`
        query {
          posts(where: { likes_some: { username: "admin" } }) {
            title
          }
        }
      `,
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
      Object {
        "posts": Array [
          Object {
            "title": "Post with likes",
          },
        ],
      }
    `);
  }
});

test('relation reconnect', async () => {
  let postId;
  {
    let { errors, data } = await query({
      query: gql`
        mutation {
          createPost(
            data: {
              title: "Post with likes"
              body: "Post with likes"
              likes: { connect: [{ User: { username: "admin" } }] }
            }
          ) {
            id
            likes {
              username
            }
          }
        }
      `,
    });
    expect(errors).toBeUndefined();
    postId = data.createPost.id;
  }

  {
    let { errors, data } = await query({
      query: gql`
        mutation($postId: ObjectID) {
          updatePost(
            where: { id: $postId }
            data: {
              title: "123"
              likes: { reconnect: [{ User: { username: "admin" } }] }
            }
          ) {
            likes {
              username
            }
          }
        }
      `,
      variables: {
        postId,
      },
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
      Object {
        "updatePost": Object {
          "likes": Array [
            Object {
              "username": "admin",
            },
          ],
        },
      }
    `);
  }
});

test('extRelation single', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        users(where: { username: "admin" }) {
          lastPost {
            title
          }
        }
      }
    `,
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
     Object {
       "users": Array [
         Object {
           "lastPost": Object {
             "title": "Post with likes",
           },
         },
       ],
     }
  `);
});
