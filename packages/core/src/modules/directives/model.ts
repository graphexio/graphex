import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import pluralize from 'pluralize';

import SDLSyntaxException from '../../sdlSyntaxException';
import { getDirective, lowercaseFirstLetter } from '../../utils';
import { isObjectType } from 'graphql';
import { AMModelType, AMObjectType } from '../../definitions';

export const MULTIPLE_MODEL = 'multipleModel';
export const MODEL_WITH_EMBEDDED = 'modelWithEmbedded';

export const typeDef = gql`
  directive @model(collection: String = null) on OBJECT | INTERFACE
`;

class Model extends SchemaDirectiveVisitor {
  visitObject(object) {
    const { collection } = this.args;
    object.mmModel = true;
    object.mmCollectionName =
      collection || lowercaseFirstLetter(pluralize(object.name));

    //validate usage
    object._interfaces.forEach(iface => {
      if (getDirective(iface, 'model')) {
        throw new SDLSyntaxException(
          `Type '${object.name}' can not be marked with @model directive because it's interface ${iface.name} marked with @model directive`,
          MULTIPLE_MODEL,
          [object, iface]
        );
      }
      if (getDirective(iface, 'embedded')) {
        throw new SDLSyntaxException(
          `Type '${object.name}' can not be marked with @model directive because it's interface ${iface.name} marked with @embedded directive`,
          MODEL_WITH_EMBEDDED,
          [object, iface]
        );
      }
    });
  }

  visitInterface(iface) {
    const { collection } = this.args;
    iface.mmModel = true;
    iface.mmCollectionName =
      collection || lowercaseFirstLetter(pluralize(iface.name));

    Object.values(this.schema.getTypeMap())
      .filter(
        type => isObjectType(type) && type.getInterfaces().includes(iface)
      )
      .forEach((type: AMModelType & AMObjectType) => {
        type.mmCollectionName = iface.mmCollectionName;

        //validate usage
        type
          .getInterfaces()
          .filter(i => i != iface)
          .forEach(i => {
            if (getDirective(i, 'model')) {
              throw new SDLSyntaxException(
                `Type '${type.name}' can not inherit both '${iface.name}' and '${i.name}' because they marked with @model directive`,
                MULTIPLE_MODEL,
                [i, iface]
              );
            }
            if (getDirective(i, 'embedded')) {
              throw new SDLSyntaxException(
                `Type '${type.name}' can not inherit both '${iface.name}' and '${i.name}' because they marked with @model and @embedded directives`,
                MODEL_WITH_EMBEDDED,
                [i, iface]
              );
            }
          });
      });

    //Set discriminator
    if (!iface.mmDiscriminatorField) {
      iface.mmDiscriminatorField = '_type';
    }

    iface.mmDiscriminatorMap = iface.mmDiscriminatorMap || {};
    Object.values(this.schema.getTypeMap())
      .filter(
        type => isObjectType(type) && type.getInterfaces().includes(iface)
      )
      .forEach((type: AMModelType & AMObjectType) => {
        if (!type.mmDiscriminator) {
          type.mmDiscriminator = lowercaseFirstLetter(type.name);
        }

        type.mmDiscriminatorField = iface.mmDiscriminatorField;
        iface.mmDiscriminatorMap[type.mmDiscriminator] = type.name;

      });

    // iface.mmOnSchemaInit = () => {
    //   Object.values(SchemaTypes)
    //     .filter(
    //       type =>
    //         Array.isArray(type._interfaces) && type._interfaces.includes(iface)
    //     )
    //     .forEach(type => {
    //       type.mmDiscriminatorField = iface.mmDiscriminatorField;
    //       iface.mmDiscriminatorMap[type.mmDiscriminator] = type.name;
    //     });
    // };

    iface.resolveType = doc => {
      return iface.mmDiscriminatorMap[doc[iface.mmDiscriminatorField]];
    };
    ////////////
  }
}

export const schemaDirectives = {
  model: Model,
};
