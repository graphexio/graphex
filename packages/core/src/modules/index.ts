import * as Model from './directives/model';

import * as InitInputTypes from './directives/initInputTypes';
import * as Discriminator from './directives/discriminator';
import * as CreatedAt from './directives/createdAt';
import * as UpdatedAt from './directives/updatedAt';
import * as Default from './directives/default';
import * as Abstract from './directives/abstract';
import * as DB from './directives/db';
import * as Relation from './directives/relation';
import * as ExtRelation from './directives/extRelation';
import * as ID from './directives/id';
// import * as Inherit from './directives/inherit';
import * as Inherit from '@apollo-model/directive-inherit';
import * as Unique from './directives/unique';
import * as Embedded from './directives/embedded';

import * as Date from './scalars/date';
import * as JSON from './scalars/JSON';
import * as ObjectID from './scalars/objectID';

export default [
  Model,
  InitInputTypes,

  Discriminator,
  CreatedAt,
  UpdatedAt,
  Default,
  Abstract,
  DB,
  Relation,
  ExtRelation,
  ID,
  Inherit,
  Unique,
  Embedded,

  Date,
  JSON,
  ObjectID,
];
