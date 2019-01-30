import _ from 'lodash';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export class TimestampDirective extends SchemaDirectiveVisitor {
  _setDateCreate = fieldName => params => {
    return {
      [fieldName]: new Date().toISOString(),
    };
  };
  _setDateUpdate = fieldName => params => {
    return {
      [fieldName]: new Date().toISOString(),
    };
  };
}
