import * as GeoJSON from './geoJSON';
import * as InitInputTypes from './directives/initInputTypes';
import * as Discriminator from './directives/discriminator';
import * as CreatedAt from './directives/createdAt';
import * as UpdatedAt from './directives/updatedAt';
import * as Default from './directives/default';

export default [
  InitInputTypes,
  GeoJSON,
  Discriminator,
  CreatedAt,
  UpdatedAt,
  Default,
];
