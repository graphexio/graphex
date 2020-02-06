import { IntrospectionSchema, IntrospectionType } from 'graphql';

export interface Resource {
  type: IntrospectionType;
  [key: string]: any;
}

export interface IntrospectionResultData {
  types: IntrospectionType[];
  queries: IntrospectionType[];
  resources: Resource[];
  schema: IntrospectionSchema;
}
