import { SchemaDirectiveVisitor } from 'graphql-tools';

export class TimestampDirective extends SchemaDirectiveVisitor {
  _setDate = fieldName => params => {
    return {
      [fieldName]: new Date(),
    };
  };
}
