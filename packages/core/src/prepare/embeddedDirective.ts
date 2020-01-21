import { GraphQLSchema, isObjectType, isInterfaceType } from 'graphql';
import { getDirectiveAST } from '../utils';
import { AMModelField, AMModelType } from '../definitions';

export const embeddedDirective = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach((iface: AMModelType) => {
    if (isInterfaceType(iface) && iface.mmEmbedded) {
      Object.values(schema.getTypeMap())
        .filter(type => {
          if (isObjectType(type)) {
            return type.getInterfaces().includes(iface);
          }
        })
        .forEach((type: AMModelType) => {
          type.mmDiscriminatorField = iface.mmDiscriminatorField;
          iface.mmDiscriminatorMap[type.mmDiscriminator] = type.name;
        });
    }
  });
};
