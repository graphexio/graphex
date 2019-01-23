import ObjectID, {typeDef as ObjectIDSchema} from './objectID';
import {DateScalar as Date, DateSchema} from "./date";

export default {
  ObjectID,
  Date
};

export const typeDefs = [ObjectIDSchema, DateSchema];
