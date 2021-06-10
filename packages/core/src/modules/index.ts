import * as Inherit from '@graphex/directive-inherit';
// import * as Default from './directives/default';
import * as Abstract from './directives/abstract';
import * as CreatedAt from './directives/createdAt';
import * as DB from './directives/db';
import * as Default from './directives/default';
import * as Discriminator from './directives/discriminator';
import * as ID from './directives/id';
import * as Model from './directives/model';
import * as ReadOnly from './directives/readonly';
import * as Unique from './directives/unique';
import * as UpdatedAt from './directives/updatedAt';
import * as Date from './scalars/date';
import * as JSON from './scalars/JSON';
import * as ObjectID from './scalars/objectID';
import * as NoArrayFilter from './directives/noArrayFilter';
import * as Subdocument from './directives/subdocument';
import * as RelationOutside from './directives/relationOutside';
import * as Federated from './directives/federated';
import * as External from './directives/external';

import * as ExtRelation from '../relations/directives/extRelation';
import * as Relation from '../relations/directives/relation';

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
  ReadOnly,
  Default,

  Date,
  JSON,
  ObjectID,
  NoArrayFilter,
  Subdocument,
  RelationOutside,
  Federated,
  External,
];
