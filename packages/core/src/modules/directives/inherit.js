import { SchemaDirectiveVisitor } from 'graphql-tools';
import { lowercaseFirstLetter } from '../../utils';

export const typeDef = `directive @inherit on INTERFACE`;

class Inherit extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { _typeMap: SchemaTypes } = this.schema;

    Object.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        type._fields = { ...iface._fields, ...type._fields };
      });
  }
}

export const schemaDirectives = {
  inherit: Inherit,
};
