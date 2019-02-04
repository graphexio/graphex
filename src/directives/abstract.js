import { SchemaDirectiveVisitor } from 'graphql-tools';

export const AbstractScheme = `directive @abstract(from:String = null) on INTERFACE`;

export default class Inherit extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { _typeMap: SchemaTypes } = this.schema;
    iface.mmAbstract = true;
    iface.mmAbstractTypes = [];
    const { from = null } = this.args;
    if (from) {
      let fromAbstract = Object.values(SchemaTypes).find(
        type => type.name === from
      );
      if (!fromAbstract || !fromAbstract.mmAbstract) {
        throw `from:${from} was not found or does not contain the abstract directive`;
      }
      iface._fields = { ...fromAbstract._fields, ...iface._fields };
    }
    
    Object.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        iface.mmAbstractTypes.push(type);
        type._fields = { ...iface._fields, ...type._fields };
      });
  }
}
