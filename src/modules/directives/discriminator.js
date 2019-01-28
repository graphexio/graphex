import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const typeDef = gql`
  directive @discriminator(value: String) on OBJECT | INTERFACE
`;

class Discriminator extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { value } = this.args;
    iface.mmDiscriminatorField = value;
  }

  visitObject(object) {
    const { value } = this.args;
    object.mmDiscriminator = value;
  }
}

export const schemaDirectives = {
  discriminator: Discriminator,
};
