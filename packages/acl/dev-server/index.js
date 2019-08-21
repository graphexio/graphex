import { ApolloServer } from 'apollo-server';
import { schema } from './schema';

import {
  applyRules,
  modelAccessRule,
  fieldAccessRule,
  regexAccessRule,
} from '../src';

let aclSchema = applyRules(
  schema,
  [modelAccessRule('.*', 'CRU'), fieldAccessRule('.*', '.*', 'CRU')],
  [
    fieldAccessRule('.*', 'title', 'CRU'),
    fieldAccessRule('.*', 'createdAt', 'CRU'),
    fieldAccessRule('.*', 'updatedAt', 'CRU'),
    modelAccessRule('User', 'CRUD'),
    modelAccessRule('Admin', 'CRUD'),
    modelAccessRule('Subscriber', 'CRUD'),
  ]
);
// console.log(aclSchema.getTypeMap().Query.getFields());
export const server = new ApolloServer({
  schema: aclSchema,
  introspection: true,
  playground: true,
});

server.listen({ port: 4001 }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
