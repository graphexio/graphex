import ObjectID, {typeDef as ObjectIDSchema} from './objectID';
import {DateScalar, DateSchema} from "./date";

export default {
  ObjectID,
  Date: DateScalar
};

export const typeDefs = [ObjectIDSchema, DateSchema];
