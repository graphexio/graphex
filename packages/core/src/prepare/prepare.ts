import { GraphQLSchema } from 'graphql';
import { fillDbName } from './fillDbName';
import { relationFieldsVisitorEvents } from './relationFieldsVisitorEvents';
import { fieldFactories } from './fieldFactories';
import { fieldVisitorEvents } from './fieldVisitorEvents';

import { relationDirective } from './relationDirective';
import { extRelationDirective } from './extRelationDirective';
import { createdAtDirective } from './createdAtDirective';
import { updatedAtDirective } from './updatedAtDirective';
import { embeddedDirective } from './embeddedDirective';
import { defaultDirective } from './defaultDirective';
import { validations } from './validations';
import { rootFields } from './rootFields';
import { relationsArguments } from './relationsArguments';
import { connectionFields } from './connectionFields';
import { nestedArrays } from './nestedArrays';

import { AMConfigResolver } from '../config/resolver';
import { AMOptions, AMSchemaInfo } from '../definitions';

export const prepare = (options: {
  schema: GraphQLSchema;
  schemaInfo: AMSchemaInfo;
  configResolver: AMConfigResolver;
  fieldFactoriesMap: {};
  fieldVisitorEventsMap: {};
  options: AMOptions;
}) => {
  fillDbName(options.schema);
  relationDirective(options.schema);
  extRelationDirective(options.schema);
  fieldFactories(options.schema, options.fieldFactoriesMap);
  fieldVisitorEvents(options.schema, options.fieldVisitorEventsMap);
  relationFieldsVisitorEvents(options.schema);

  /* validations */
  validations(options.schema);

  /* directives */
  createdAtDirective(options.schema);
  updatedAtDirective(options.schema);
  embeddedDirective(options.schema);
  defaultDirective(options.schema);

  rootFields(options);

  relationsArguments(options.schema, options.configResolver);
  connectionFields(options.schema, options.configResolver);
  nestedArrays(options.schema, options.configResolver);
};
