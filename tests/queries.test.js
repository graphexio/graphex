jest.setTimeout(20000);

const { query, mutate, mongod, connectToDatabase } = require('./apolloTest');
const _ = require('lodash');

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

jest.setTimeout(10000);

test('QueryCategories empty', async () => {
  let { data } = await query({
    query: QueryCategories,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

test('CreateCategory', async () => {
  let { data } = await mutate({
    mutation: CreateCategory,
    variables: { title: 'root' },
  });
  expect(data).toMatchSnapshot();
});

test('QueryCategories after create', async () => {
  let { data } = await query({
    query: QueryCategories,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

test('CreateChildCategory "JS"', async () => {
  let { data } = await mutate({
    mutation: CreateChildCategory,
    variables: { title: 'JS', parentTitle: 'root' },
  });
  expect(data).toMatchSnapshot();
});

test('CreateChildCategory "MongoDB"', async () => {
  let { data } = await mutate({
    mutation: CreateChildCategory,
    variables: { title: 'MongoDB', parentTitle: 'root' },
  });
  expect(data).toMatchSnapshot();
});

test('CreateChildCategory "React"', async () => {
  let { data } = await mutate({
    mutation: CreateChildCategory,
    variables: { title: 'React', parentTitle: 'JS' },
  });
  expect(data).toMatchSnapshot();
});

test('QueryCategoriesExtRelation', async () => {
  let { data } = await query({
    query: QueryCategoriesExtRelation,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

test('QueryCategoriesByTitle', async () => {
  let { data } = await query({
    query: CategoriesFilterByTitle,
    variables: { title: 'root' },
  });
  expect(data).toMatchSnapshot();
});

test('CategoriesComplexFilterOr', async () => {
  let { data } = await query({
    query: CategoriesComplexFilterOr,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

test('CategoriesRelationFilter', async () => {
  let { data } = await query({
    query: CategoriesRelationFilter,
    variables: { title: 'root' },
  });
  expect(data).toMatchSnapshot();
});

test('CreateSubscriberWithEmbeddedDocument', async () => {
  let { data } = await query({
    query: CreateSubscriberWithEmbeddedDocument,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

test('CreateAdmin', async () => {
  let { data } = await query({
    query: CreateAdmin,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

let postId = '';
test('CreatePostWithInterfaceRelation', async () => {
  let { data } = await query({
    query: CreatePostWithInterfaceRelation,
    variables: {},
  });

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
  let { data } = await query({
    query: QueryPostsNearPoint,
    variables: {},
  });
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
    query: CategoriesOrderByFieldWithDBDirective,
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
    query: QueryShops,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

test('QueryShopById', async () => {
  let { data } = await query({
    query: QueryShopById,
    variables: { shopId },
  });
  expect(data).toMatchSnapshot();
});

test('Update Post create abstract relation Hotel ', async () => {
  let { data } = await query({
    query: UpdatePostCreateHotel,
    variables: { postId },
  });
  expect(data).toMatchSnapshot();
});

test('QueryHotels', async () => {
  let { data } = await query({
    query: QueryHotels,
    variables: {},
  });
  expect(data).toMatchSnapshot();
});

test('UpdatePostConnectShop', async () => {
  let { data } = await query({
    query: UpdatePostConnectShop,
    variables: { postId, shopId },
  });
  expect(data).toMatchSnapshot();
});

test('UpdatePostDisconnectShop', async () => {
  let { data } = await query({
    query: UpdatePostDisconnectShop,
    variables: { postId, shopId },
  });
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

test('QueryShopById', async () => {
  let { data } = await query({
    query: QueryShopById,
    variables: { shopId },
  });
  expect(data).toMatchSnapshot();
});

beforeAll(async () => {
  let DB = await connectToDatabase();
  DB.collection('posts').createIndex({ place: '2dsphere' });
});

afterAll(async () => {
  mongod.stop();
});
