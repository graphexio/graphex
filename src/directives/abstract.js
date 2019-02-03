import {SchemaDirectiveVisitor} from 'graphql-tools';

export const AbstractScheme = `directive @abstract on INTERFACE`;

export default class Inherit extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    
    const {_typeMap: SchemaTypes} = this.schema;
    iface.mmAbstract = true;
    iface.mmAbstractTypes = [];
    Object.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        iface.mmAbstractTypes.push(type);
        type._fields = {...iface._fields, ...type._fields};
      });
  }
}
