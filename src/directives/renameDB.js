import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const RenameDBScheme = `directive @renameDB(name:String!) on FIELD_DEFINITION`;

export default class RenameDB extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { name } = this.args;
    const { resolveMapFilterToSelector } = field;
    field.resolveMapFilterToSelector = async function(params) {
      // console.log(params);
      if (resolveMapFilterToSelector) {
        params = await resolveMapFilterToSelector.apply(this, params);
      }
      // console.log({ fieldName, value });
      return params.map(({ fieldName, value }) => ({ fieldName: name, value }));
    };
  }
}

export function RenameDBResolver(next, source, args, ctx, info) {
  const { name } = args;
  info.fieldName = name;
  return next();
  // console.log({ next, source, args, ctx, info });
}
