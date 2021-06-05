import { GraphQLSchema, isInterfaceType, isObjectType } from 'graphql';
import { AMModelType } from '../definitions';
import { lowercaseFirstLetter, isAbstractType } from '../utils';

export const fillDiscriminators = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach((iface: AMModelType) => {
    if (
      isInterfaceType(iface) &&
      !isAbstractType(iface) // TODO: move this logic into abstract interface module
    ) {
      if (!iface.mmDiscriminatorField) {
        iface.mmDiscriminatorField = '_type';
      }

      iface.mmDiscriminatorMap = iface.mmDiscriminatorMap || {};
      Object.values(schema.getTypeMap())
        .filter(
          type => isObjectType(type) && type.getInterfaces().includes(iface)
        )
        .forEach((type: AMModelType) => {
          type.mmModelInherited = true;
          if (!type.mmDiscriminator) {
            type.mmDiscriminator = lowercaseFirstLetter(type.name);
          }

          type.mmDiscriminatorField = iface.mmDiscriminatorField;
          iface.mmDiscriminatorMap[type.mmDiscriminator] = type.name;
        });

      iface.resolveType = doc => {
        return iface.mmDiscriminatorMap[doc[iface.mmDiscriminatorField]];
      };
    }
  });
};
