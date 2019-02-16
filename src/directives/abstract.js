import { SchemaDirectiveVisitor } from 'graphql-tools';

export const AbstractScheme = `directive @abstract(from:String = null) on INTERFACE`;

export default class Inherit extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { _typeMap: SchemaTypes } = this.schema;
    iface.mmAbstract = true;
    iface.mmAbstractTypes = [];
    iface._setAbstractTypes = function() {
      if (this.mmFromAbstract) {
        let types = new Set([
          ...this.mmFromAbstract.mmAbstractTypes,
          ...this.mmAbstractTypes,
        ]);
        this.mmFromAbstract.mmAbstractTypes = Array.from(types);
        this.mmFromAbstract._setAbstractTypes();
      }
    }.bind(iface);

    iface._addFromInterfaces = function(type) {
      if (this.mmFrom) {
        if (!type._interfaces.find(i => i === this.mmFrom)) {
          type._interfaces.push(this.mmFrom);
          this.mmFrom._addFromInterfaces(type);
        }
      }
    }.bind(iface);

    const { from = null } = this.args;
    if (from) {
      let fromAbstract = Object.values(SchemaTypes).find(
        type => type.name === from
      );
      if (!fromAbstract) {
        throw `from:${from} was not found or does not contain the abstract directive`;
      }
      iface.mmFromAbstract = fromAbstract.mmInherit ? fromAbstract : null;
      iface.mmFrom = fromAbstract;
      iface._fields = { ...fromAbstract._fields, ...iface._fields };
    }

    Object.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        iface.mmAbstractTypes.push(type);
        iface._addFromInterfaces(type);
        type._fields = { ...iface._fields, ...type._fields };
      });

    iface._setAbstractTypes();
    iface.resolveType = data => {
      return iface.mmAbstractTypes.find(
        t => t.mmCollectionName === data['mmCollectionName']
      );
    };
  }
}
