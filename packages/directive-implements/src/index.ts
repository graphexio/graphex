import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const typeDefs = gql`
  directive @implements(name: String) on INTERFACE
`;

class Implements extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { name } = this.args;
    const schema = this.schema as any;

    const names = name.replace(/\s/g, '').split('&');

    const typeMap = this.schema.getTypeMap();
    const implementIFaces = names.map(name => typeMap[name]);
    implementIFaces.forEach(newIface => {
      iface._fields = { ...iface._fields, ...newIface._fields };
    });

    Object.values(typeMap)
      .filter(
        (type: any) => type._interfaces && type._interfaces.includes(iface)
      )
      .forEach((type: any) => {
        type._interfaces.push(...implementIFaces);

        names.forEach(ifaceName => {
          if (!schema._implementations[ifaceName])
            schema._implementations[ifaceName] = [];

          schema._implementations[ifaceName].push(type);
        });
      });
  }
}

export const schemaDirectives = {
  implements: Implements,
};
