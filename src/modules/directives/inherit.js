import { SchemaDirectiveVisitor } from 'graphql-tools';
import { lowercaseFirstLetter } from '../../utils';

export const typeDef = `directive @inherit(from:String = null) on INTERFACE`;

class Inherit extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { _typeMap: SchemaTypes } = this.schema;

    Object.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        type._fields = { ...type._fields, ...iface._fields };
      });

    //Looks like this code is unused
    ///
    ///
    // iface.mmInherit = true;
    //
    // iface._addFromInterfaces = function(type) {
    //   if (this.mmFrom) {
    //     if (!type._interfaces.find(i => i === this.mmFrom)) {
    //       type._interfaces.push(this.mmFrom);
    //       this.mmFrom._addFromInterfaces(type);
    //     }
    //   }
    // }.bind(iface);
    //
    // const { from = null } = this.args;
    // if (from) {
    //   let fromInherit = Object.values(SchemaTypes).find(
    //     type => type.name === from
    //   );
    //   if (!fromInherit) {
    //     throw `from:${from} was not found or does not contain the inherit directive`;
    //   }
    //   iface.mmFrom = fromInherit;
    //   iface._fields = { ...fromInherit._fields, ...iface._fields };
    // }
    // iface.mmOnSchemaInit = () => {
    //   Object.values(SchemaTypes)
    //     .filter(
    //       type =>
    //         Array.isArray(type._interfaces) && type._interfaces.includes(iface)
    //     )
    //     .forEach(type => {
    //       iface._addFromInterfaces(type);
    //     });
    // };
  }
}

export const schemaDirectives = {
  inherit: Inherit,
};
