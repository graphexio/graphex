import gql from 'graphql-tag';
import _ from 'lodash';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { lowercaseFirstLetter } from '../../utils';

export const typeDef = gql`
  directive @embedded on OBJECT | INTERFACE
`;

class EmbeddedDirective extends SchemaDirectiveVisitor {
  visitObject(object) {
    object.mmEmbedded = true;
  }
  visitInterface(iface) {
    const { _typeMap: SchemaTypes } = this.schema;
    iface.mmEmbedded = true;

    //Set discriminator
    if (!iface.mmDiscriminatorField) {
      iface.mmDiscriminatorField = '_type';
    }

    Object.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        if (!type.mmDiscriminator) {
          type.mmDiscriminator = lowercaseFirstLetter(type.name);
        }
      });
    iface.mmDiscriminatorMap = iface.mmDiscriminatorMap || {};

    iface.resolveType = doc => {
      return iface.mmDiscriminatorMap[doc[iface.mmDiscriminatorField]];
    };
    ////////////
  }
}

export const schemaDirectives = {
  embedded: EmbeddedDirective,
};
