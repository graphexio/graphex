jest.setTimeout(20000);

import prepare from './integration-prepare';
const testInstance = prepare();
const { query, mutate, mongod, connectToDatabase } = testInstance.start({
  aclWhere: true,
});

const _ = require('lodash');
import gql from 'graphql-tag';
import { getIntrospectionQuery } from 'graphql';

beforeAll(async () => {
  let DB = await connectToDatabase();
  DB.collection('posts').createIndex({ place: '2dsphere' });
});

afterAll(async () => {
  mongod.stop();
});

let admin1, admin2;
test('Create admins', async () => {
  let { errors, data } = await query({
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
