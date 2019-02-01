import _ from 'lodash';
import {SchemaDirectiveVisitor} from 'graphql-tools';

export class TimestampDirective extends SchemaDirectiveVisitor {
  _setDate = field => params => {
    return {
      [field.mmDatabaseName || field.name]: new Date()
    };
  };
}
