import { SchemaDirectiveVisitor } from 'graphql-tools';
import { getDirective } from '../../utils';
import SDLSyntaxException from '../../sdlSyntaxException';

export const SHOULD_BE_MODEL = 'shouldBeModel';
export const ABSTRACT_WITH_MODEL = 'abstractWithModel';
export const ABSTRACT_WITH_EMBEDDED = 'abstractWithEmbedded';

export const typeDef = `directive @abstract(from:String = null) on INTERFACE`;

class Abstract extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { _typeMap: SchemaTypes } = this.schema;
    iface.mmAbstract = true;
    iface.mmAbstractTypes = [];

    //Looks like this code is unused
    //
    //
    // iface.mmAbstractTypes = [];
    // iface._setAbstractTypes = function() {
    //   if (this.mmFromAbstract) {
    //     let types = new Set([
    //       ...this.mmFromAbstract.mmAbstractTypes,
    //       ...this.mmAbstractTypes,
    //     ]);
    //     this.mmFromAbstract.mmAbstractTypes = Array.from(types);
    //     this.mmFromAbstract._setAbstractTypes();
    //   }
    // }.bind(iface);
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
    //   let fromAbstract = Object.values(SchemaTypes).find(
    //     type => type.name === from
    //   );
    //   if (!fromAbstract) {
    //     throw `from:${from} was not found or does not contain the abstract directive`;
    //   }
    //   iface.mmFromAbstract = fromAbstract.mmInherit ? fromAbstract : null;
    //   iface.mmFrom = fromAbstract;
    //   iface._fields = { ...fromAbstract._fields, ...iface._fields };
    // }

    Object.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        iface.mmAbstractTypes.push(type);
        // iface._addFromInterfaces(type);

        //validate usage
        if (!getDirective(type, 'model')) {
          throw new SDLSyntaxException(
            `
            Type '${type.name}' is inherited from abstract interface '${
              iface.name
            }' and should be marked with @model directive
          `,
            SHOULD_BE_MODEL,
            [type, iface]
          );
        }

        type._interfaces
          .filter(i => i != iface)
          .forEach(i => {
            if (getDirective(i, 'model')) {
              throw new SDLSyntaxException(
                `Type '${type.name}' can not inherit both '${
                  iface.name
                }' and '${
                  i.name
                }' because they marked with @abstract and @model directives`,
                ABSTRACT_WITH_MODEL,
                [i, iface]
              );
            }
            if (getDirective(i, 'embedded')) {
              throw new SDLSyntaxException(
                `Type '${type.name}' can not inherit both '${
                  iface.name
                }' and '${
                  i.name
                }' because they marked with @abstract and @embedded directives`,
                ABSTRACT_WITH_EMBEDDED,
                [i, iface]
              );
            }
          });
      });

    // iface._setAbstractTypes();
    iface.resolveType = data => {
      return iface.mmAbstractTypes.find(
        t => t.mmCollectionName === data['mmCollectionName']
      );
    };
  }
}

export const schemaDirectives = {
  abstract: Abstract,
};
