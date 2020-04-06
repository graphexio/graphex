jest.setTimeout(20000);

import prepare from './integration-prepare';
const testInstance = prepare();
let query, mutate, connectToDatabase;

const _ = require('lodash');
import gql from 'graphql-tag';
import { getIntrospectionQuery } from 'graphql';

beforeAll(async () => {
  const instance = await testInstance.start({
    aclWhere: true,
  });
  query = instance.query;
  mutate = instance.mutate;
  connectToDatabase = instance.connectToDatabase;

  const DB = await connectToDatabase();
  await DB.collection('posts').createIndex({ place: '2dsphere' });
});

afterAll(async () => {
  testInstance.stop();
});

let admin1, admin2;
test('Create admins', async () => {
  const { errors, data } = await query({
    query: gql`
      mutation {
        admin1: createAdmin(data: { username: "admin1" }) {
          id
          username
        }
        admin2: createAdmin(data: { username: "admin2" }) {
          id
          username
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  admin1 = data.admin1;
  admin2 = data.admin2;
});
