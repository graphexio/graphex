jest.setTimeout(20000);

const { query, mutate, mongod, connectToDatabase } = require('./apolloTest');
const _ = require('lodash');
import gql from 'graphql-tag';

import QueryCategories from './queries/queryCategories.graphql';
import CreateCategory from './queries/createCategory.graphql';
import CreateChildCategory from './queries/createChildCategory.graphql';
import QueryCategoriesExtRelation from './queries/queryCategoriesExtRelation.graphql';
import CategoriesFilterByTitle from './queries/categoriesFilterByTitle.graphql';
import CategoriesComplexFilterOr from './queries/categoriesComplexFilterOr.graphql';
import CategoriesRelationFilter from './queries/categoriesRelationFilter.graphql';
import CreateSubscriberWithEmbeddedDocument from './queries/createSubscriberWithEmbeddedDocument.graphql';
import CreateAdmin from './queries/createAdmin.graphql';
import CreatePostWithInterfaceRelation from './queries/createPostWithInterfaceRelation.graphql';
import QueryUsersInterface from './queries/queryUsersInterface.graphql';
import QueryPostsNearPoint from './queries/queryPostsNearPoint.graphql';
import CategoryDelete from './queries/categoryDelete.graphql';
import CategoriesSameFieldFilter from './queries/categoriesSameFieldFilter.graphql';
import CategoriesOrderByFieldWithDBDirective from './queries/categoriesOrderByFieldWithDBDirective.graphql';
import CreateShop from './queries/createShop.graphql';
import CreateHotel from './queries/createHotel.graphql';
import QueryShops from './queries/queryShops.graphql';
import QueryShopById from './queries/queryShopById.graphql';
import QueryHotels from './queries/queryHotels.graphql';
import UpdatePostCreateHotel from './queries/updatePostCreateHotel.graphql';
import UpdatePostConnectShop from './queries/updatePostConnectShop.graphql';
import UpdatePostDisconnectShop from './queries/updatePostDisconnectShop.graphql';
import UpdatePostDeleteShop from './queries/updatePostDeleteShop.graphql';
import { ObjectId } from 'mongodb';

jest.setTimeout(10000);

test('QueryCategories empty', async () => {
  let { data } = await query({
    query: QueryCategories,
    variables: {},
  });
  expect(data).toMatchInlineSnapshot(`
                                    Object {
                                      "categories": Array [],
                                    }
                `);
});

test('CreateCategory', async () => {
  let { data } = await mutate({
    mutation: CreateCategory,
    variables: { title: 'root' },
  });
  expect(data).toMatchInlineSnapshot(`
                                                Object {
                                                  "createCategory": Object {
                                                    "title": "root",
                                                  },
                                                }
                `);
});

test('QuerySingleCategory', async () => {
  let { data } = await query({
    query: gql`
      {
        category(where: { title: "root" }) {
          title
        }
      }
    `,
  });
  expect(data).toMatchInlineSnapshot(`
                                      Object {
                                        "category": Object {
                                          "title": "root",
                                        },
                                      }
                  `);
});

test('QueryCategories after create', async () => {
  let { data } = await query({
    query: QueryCategories,
    variables: {},
  });
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
  let { data } = await mutate({
    mutation: CreateChildCategory,
    variables: { title: 'JS', parentTitle: 'root' },
  });
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
  let { data } = await mutate({
    mutation: CreateChildCategory,
    variables: { title: 'MongoDB', parentTitle: 'root' },
  });
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
  let { data } = await mutate({
    mutation: CreateChildCategory,
    variables: { title: 'React', parentTitle: 'JS' },
  });
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
  let { data } = await mutate({
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
  expect(data).toMatchInlineSnapshot(`
                                          Object {
                                            "updateCategory": Object {
                                              "title": "JavaScript",
                                            },
                                          }
                    `);
});

test('Query categories after renaming', async () => {
  let { data } = await query({
    query: gql`
      {
        categories {
          title
        }
      }
    `,
  });
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

test('Rename category back', async () => {
  let { data } = await mutate({
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
  let { data } = await query({
    query: QueryCategoriesExtRelation,
    variables: {},
  });
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

test('QueryCategoriesByTitle', async () => {
  let { data } = await query({
    query: CategoriesFilterByTitle,
    variables: { title: 'root' },
  });
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
  let { data } = await query({
    query: CategoriesComplexFilterOr,
    variables: {},
  });
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
  let { data } = await query({
    query: CategoriesRelationFilter,
    variables: { title: 'root' },
  });
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
  let { data } = await query({
    query: CreateSubscriberWithEmbeddedDocument,
    variables: {},
  });
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
    query: CreateAdmin,
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
            place: { type: Point, coordinates: [0, 51] }
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
  expect(data).toMatchSnapshot();
});

test('QueryUsersInterface', async () => {
  let { data } = await query({
    query: QueryUsersInterface,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

test('QueryPostsNearPoint', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        posts(
          where: {
            place_near: {
              geometry: { type: Point, coordinates: [0, 51.01] }
              maxDistance: 10000
            }
          }
        ) {
          title
          place {
            distance(toPoint: { type: Point, coordinates: [0, 51.01] })
          }
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchSnapshot();
});

test('CategoriesSameFieldFilter', async () => {
  let { data } = await query({
    query: CategoriesSameFieldFilter,
    variables: { title: 'React' },
  });
  expect(data).toMatchSnapshot();
});

test('CategoriesOrderByFieldWithDBDirective', async () => {
  let { data } = await query({
    query: gql`
      query {
        categories(orderBy: createdAt_DESC) {
          title
        }
      }
    `,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

test('CategoryDelete', async () => {
  let { data } = await query({
    query: CategoryDelete,
    variables: { title: 'React' },
  });
  expect(data).toMatchSnapshot();
});

test('QueryCategories after delete', async () => {
  let { data } = await query({
    query: QueryCategories,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

let shopId = '';
test('CreateShop abstract interface', async () => {
  let { data } = await query({
    query: CreateShop,
    variables: { title: 'ifc mall' },
  });
  shopId = data.createShop.id;
  delete data.createShop.id;

  expect(data).toMatchSnapshot();
});

test('QueryShops', async () => {
  let { data } = await query({
    query: gql`
      {
        shops {
          title
        }
      }
    `,
    variables: {},
  });
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
  expect(data).toMatchSnapshot();
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
  let { data } = await query({
    query: QueryHotels,
    variables: {},
  });
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
  expect(data).toMatchSnapshot();
});

test('UpdatePostDisconnectShop', async () => {
  let { errors, data } = await query({
    query: UpdatePostDisconnectShop,
    variables: { postId, shopId },
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchSnapshot();
});

test('UpdatePostConnectShop', async () => {
  let { data } = await query({
    query: UpdatePostConnectShop,
    variables: { postId, shopId },
  });
  expect(data).toMatchSnapshot();
});

test('UpdatePostDeleteShop', async () => {
  let { data } = await query({
    query: UpdatePostDeleteShop,
    variables: { postId, shopId },
  });
  expect(data).toMatchSnapshot();
});

test('QueryShopById after updates', async () => {
  let { data } = await query({
    query: gql`
      query shop($id: ObjectID!) {
        shop(where: { id: $id }) {
          title
        }
      }
    `,
    variables: { id: shopId },
  });
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
          data: { title: "123", body: "123", comments: { create: [] } }
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

beforeAll(async () => {
  let DB = await connectToDatabase();
  DB.collection('posts').createIndex({ place: '2dsphere' });
});

afterAll(async () => {
  mongod.stop();
});
