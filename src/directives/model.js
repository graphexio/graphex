import { SchemaDirectiveVisitor } from 'graphql-tools';
import pluralize from 'pluralize';

import { getDirective, lowercaseFirstLetter } from '../utils';

export const ModelScheme = `directive @model(collection:String=null) on OBJECT | INTERFACE`;

export default class Model extends SchemaDirectiveVisitor {
  visitObject(object) {
    const { collection } = this.args;
    object.mmCollectionName =
      collection || lowercaseFirstLetter(pluralize(object.name));
  }

  visitInterface(iface) {
    const { collection } = this.args;
    iface.mmCollectionName =
      collection || lowercaseFirstLetter(pluralize(iface.name));

    const { _typeMap: SchemaTypes } = this.schema;

    Object.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        if (getDirective(type, 'model')) {
          throw `Do not use Model directive both on interface and implementation`;
        }
        type.mmCollectionName = iface.mmCollectionName;
      });
  }
}
