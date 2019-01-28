import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
} from 'graphql';

import _ from 'lodash';
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

    _.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        if (getDirective(type, 'model')) {
          throw `Do not use Model directive both on interface and implementation`;
        }
        type.mmCollectionName = iface.mmCollectionName;
      });
  }
}
