import gql from 'graphql-tag';
import _ from 'lodash';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { lowercaseFirstLetter } from '../../utils';
import { isObjectType } from 'graphql';
import { AMModelType } from '../../definitions';

export const typeDef = gql`
  directive @embedded on OBJECT | INTERFACE
`;

class EmbeddedDirective extends SchemaDirectiveVisitor {
  visitObject(object) {
    object.mmEmbedded = true;
  }
  visitInterface(iface) {
    iface.mmEmbedded = true;

    //Set discriminator
    if (!iface.mmDiscriminatorField) {
      iface.mmDiscriminatorField = '_type';
    }

    Object.values(this.schema.getTypeMap())
      .filter(
        type => isObjectType(type) && type.getInterfaces().includes(iface)
      )
      .forEach((type: AMModelType) => {
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
