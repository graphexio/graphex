import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const typeDefs = gql`
  directive @implements(name: String) on INTERFACE
`;

class Implements extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { name } = this.args;
    let names = name.replace(/\s/g, '').split('&');

    const typeMap = this.schema.getTypeMap();
    let implementIFaces = names.map(name => typeMap[name]);
    implementIFaces.forEach(newIface => {
      iface._fields = { ...iface._fields, ...newIface._fields };
    });

    Object.values(typeMap)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        type._interfaces.push(...implementIFaces);

        names.forEach(ifaceName => {
          this.schema._implementations[ifaceName].push(type);
        });
      });
  }
}

export const schemaDirectives = {
  implements: Implements,
};
