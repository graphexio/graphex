import { GraphQLSchema } from 'graphql';
import { fillDbName } from './fillDbName';
import { addVisitorEvents } from './addVisitorEvents';
import { fieldFactories } from './fieldFactories';
import { fieldVisitorEvents } from './fieldVisitorEvents';

import { relationDirective } from './relationDirective';
import { extRelationDirective } from './extRelationDirective';
import { createdAtDirective } from './createdAtDirective';
import { updatedAtDirective } from './updatedAtDirective';
import { embeddedDirective } from './embeddedDirective';
import { defaultDirective } from './defaultDirective';
import { validations } from './validations';
import { AMConfigResolver } from '../config/resolver';
import { AMSchemaInfo } from '../definitions';

export const prepare = (options: {
  schema: GraphQLSchema;
  schemaInfo: AMSchemaInfo;
  configResolver: AMConfigResolver;
  fieldFactoriesMap: {};
  fieldVisitorEventsMap: {};
}) => {
  fillDbName(options.schema);
  relationDirective(options.schema);
  extRelationDirective(options.schema);
  addVisitorEvents(options.schema);
  fieldFactories(options.schema, options.fieldFactoriesMap);
  fieldVisitorEvents(options.schema, options.fieldVisitorEventsMap);

  /* validations */
  validations(options.schema);

  /* directives */
  createdAtDirective(options.schema);
  updatedAtDirective(options.schema);
  embeddedDirective(options.schema);
  defaultDirective(options.schema);
};
