import {
  buildClientSchema,
  getNamedType,
  GraphQLInputObjectType,
  GraphQLNamedType,
  GraphQLSchema,
} from 'graphql';
import * as R from 'ramda';
import { IntrospectionResultData } from './definitions';

export class IntrospectionResult {
  data: IntrospectionResultData;
  schema: GraphQLSchema;

  constructor(data: IntrospectionResultData) {
    this.data = data;
    this.schema = buildClientSchema({ __schema: this.data.schema });
  }

  getType(typeName: string): GraphQLNamedType {
    return this.schema.getType(typeName);
  }

  getQueryType() {
    return this.schema.getQueryType();
  }

  getMutationType() {
    return this.schema.getMutationType();
  }

  getUpdateDataType(resourceName: string) {
    const methodName = `update${resourceName}`;
    return getNamedType(
      this.getMutationType()
        .getFields()
        [methodName].args.find(R.propEq('name', 'data')).type
    ) as GraphQLInputObjectType;
  }

  getCreateDataType(resourceName: string) {
    const methodName = `create${resourceName}`;
    return getNamedType(
      this.getMutationType()
        .getFields()
        [methodName].args.find(R.propEq('name', 'data')).type
    ) as GraphQLInputObjectType;
  }
}
