import ObjectID, {typeDef as ObjectIDSchema} from './objectID';
import {DateScalar, DateSchema} from "./date";

export default {
  ObjectID,
  DateScalar
};

export const typeDefs = [ObjectIDSchema, DateSchema];
