import * as Inherit from '@graphex/directive-inherit';
// import * as Default from './directives/default';
import * as Abstract from '../schemaGeneration/model/directives/abstract';
import * as CreatedAt from '../schemaGeneration/model/directives/createdAt';
import * as DB from '../schemaGeneration/model/directives/db';
import * as Default from '../schemaGeneration/model/directives/default';
import * as Discriminator from '../schemaGeneration/model/directives/discriminator';
import * as ID from '../schemaGeneration/model/directives/id';
import * as Model from '../schemaGeneration/model/directives/model';
import * as ReadOnly from '../schemaGeneration/model/directives/readonly';
import * as Unique from '../schemaGeneration/model/directives/unique';
import * as UpdatedAt from '../schemaGeneration/model/directives/updatedAt';
import * as Date from '../schemaGeneration/model/scalars/date';
import * as JSON from '../schemaGeneration/model/scalars/JSON';
import * as ObjectID from '../schemaGeneration/model/scalars/objectID';
import * as NoArrayFilter from '../schemaGeneration/subdocuments/directives/noArrayFilter';
import * as RelationOutside from '../schemaGeneration/externalRelations/directives/relationOutside';
import * as Federated from '../schemaGeneration/federation/directives/federated';
import * as External from '../schemaGeneration/federation/directives/external';

import * as Subdocument from '../schemaGeneration/subdocuments/directives/subdocument';

import * as ExtRelation from '../schemaGeneration/relations/directives/extRelation';
import * as Relation from '../schemaGeneration/relations/directives/relation';

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
