import * as Inherit from '@graphex/directive-inherit';
// import * as Default from './directives/default';
import * as Abstract from './directives/abstract';
import * as CreatedAt from './directives/createdAt';
import * as DB from './directives/db';
import * as Default from './directives/default';
import * as Discriminator from './directives/discriminator';
import * as Embedded from './directives/embedded';
import * as ExtRelation from './directives/extRelation';
import * as ID from './directives/id';
import * as Model from './directives/model';
import * as ReadOnly from './directives/readonly';
import * as Relation from './directives/relation';
import * as Unique from './directives/unique';
import * as UpdatedAt from './directives/updatedAt';
import * as Date from './scalars/date';
import * as JSON from './scalars/JSON';
import * as ObjectID from './scalars/objectID';
import * as NoArrayFilter from './directives/noArrayFilter';
import * as Subdocument from './directives/subdocument';

export default [
  Model,

  Discriminator,
  CreatedAt,
  UpdatedAt,

  Abstract,
  DB,
  Relation,
  ExtRelation,
  ID,
  Inherit,
  Unique,
  Embedded,
  ReadOnly,
  Default,

  Date,
  JSON,
  ObjectID,
  NoArrayFilter,
  Subdocument,
];
