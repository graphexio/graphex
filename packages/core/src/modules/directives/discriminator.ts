import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { getDirective } from '../../utils';

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

    //if interface has been initialized already we shuld update it's mmDiscriminatorMap
    object.getInterfaces().forEach(iface => {
      if (getDirective(iface, 'model') && iface.mmDiscriminatorMap && object.mmDiscriminator) {
        delete iface.mmDiscriminatorMap[object.mmDiscriminator]
        iface.mmDiscriminatorMap[value] = object.name
      }
    });
    object.mmDiscriminator = value;
  }
}

export const schemaDirectives = {
  discriminator: Discriminator,
};
