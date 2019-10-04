import { GraphQLSchema } from 'graphql';
import { fillDbName } from './fillDbName';
import { addVisitorEvents } from './addVisitorEvents';

export const prepare = (schema: GraphQLSchema) => {
  fillDbName(schema);
  addVisitorEvents(schema);
};
