import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const DirectiveDBScheme = `directive @db(name:String!) on FIELD_DEFINITION`;

export default class DirectiveDB extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { name } = this.args;
    const { resolveMapFilterToSelector } = field;
    field.resolveMapFilterToSelector = async function(params) {
      if (resolveMapFilterToSelector) {
        params = await resolveMapFilterToSelector.apply(this, params);
      }
      return params.map(({ fieldName, value }) => ({ fieldName: name, value }));
    };
  }
}

export function DirectiveDBResolver(next, source, args, ctx, info) {
  const { name } = args;
  info.fieldName = name;
  return next();
}
