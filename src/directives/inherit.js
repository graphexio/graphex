import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import _ from 'lodash';
import { lowercaseFirstLetter } from '~/utils';

export const InheritScheme = `directive @inherit on INTERFACE`;

export default class Inherit extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    const { _typeMap: SchemaTypes } = this.schema;

    if (!iface.mmDiscriminatorField) {
      iface.mmDiscriminatorField = '_type';
    }

    _.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        type._fields = { ...iface._fields, ...type._fields };
        if (!type.mmDiscriminator) {
          type.mmDiscriminator = lowercaseFirstLetter(type.name);
        }
      });

    iface.mmDiscriminatorMap = {};

    iface.mmOnSchemaInit = () => {
      _.values(SchemaTypes)
        .filter(
          type =>
            _.isArray(type._interfaces) && type._interfaces.includes(iface)
        )
        .forEach(type => {
          type.mmDiscriminatorField = iface.mmDiscriminatorField;
          iface.mmDiscriminatorMap[type.mmDiscriminator] = type.name;
        });
    };

    iface.resolveType = doc => {
      return iface.mmDiscriminatorMap[doc[iface.mmDiscriminatorField]];
    };
  }
}
