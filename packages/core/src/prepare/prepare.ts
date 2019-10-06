import { GraphQLSchema } from 'graphql';
import { fillDbName } from './fillDbName';
import { addVisitorEvents } from './addVisitorEvents';
import { relationDirective } from './relationDirective';
import { extRelationDirective } from './extRelationDirective';

export const prepare = (schema: GraphQLSchema) => {
  fillDbName(schema);
  relationDirective(schema);
  extRelationDirective(schema);
  addVisitorEvents(schema);
};
