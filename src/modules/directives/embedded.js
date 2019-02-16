import _ from 'lodash';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const typeDef = `directive @embedded on OBJECT | INTERFACE`;

class EmbeddedDirective extends SchemaDirectiveVisitor {
  visitObject(object) {
    // object.mmEmbedded = true;
  }
  visitInterface(iface) {
    // iface.mmEmbedded = true;
  }
}

export const schemaDirectives = {
  embedded: EmbeddedDirective,
};
