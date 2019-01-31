import { server } from '../dev-server/server';
export { CONNECTION, DB } from '../dev-server/server';
const { createTestClient } = require('apollo-server-testing');
export const { query, mutate } = createTestClient(server);
