import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import R from 'ramda';

export const typeDefs = gql`
  directive @inherit on INTERFACE
`;

class Inherit extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { _typeMap: SchemaTypes } = this.schema as any;

    Object.values(SchemaTypes)
      .filter(
        (type: any) => type._interfaces && type._interfaces.includes(iface)
      )
      .forEach((type: any) => {
        type._fields = { ...R.clone(iface._fields), ...type._fields };
      });
  }
}

export const schemaDirectives = {
  inherit: Inherit,
};
