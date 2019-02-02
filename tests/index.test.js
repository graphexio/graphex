const { query, mutate, CONNECTION, DB } = require('./apolloTest');

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

test('CreatePostWithInterfaceRelation', async () => {
  let { data } = await query({
    query: CreatePostWithInterfaceRelation,
    variables: {},
  });
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

beforeAll(async () => {
  let db = await DB;
  let collections = await db.listCollections().toArray();
  await Promise.all(
    collections.map(({ name }) => db.collection(name).deleteMany({}))
  );
});

afterAll(async () => {
  // Closing the DB connection allows Jest to exit successfully.
  await (await CONNECTION).close();
});
