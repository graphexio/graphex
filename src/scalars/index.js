import ObjectID, { typeDef as ObjectIDSchema } from './objectID';
import { DateScalar as Date, DateSchema } from './date';
import { JSONScalar, JSONSchema } from './JSON';

export default {
  ObjectID,
  Date,
  JSON: JSONScalar,
};

export const typeDefs = [ObjectIDSchema, DateSchema, JSONSchema];
