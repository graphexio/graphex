import { GraphQLObjectType, isObjectType } from 'graphql';
import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import SDLSyntaxException from '../../sdlSyntaxException';
import { getDirective } from '../../utils';

export const SHOULD_BE_MODEL = 'shouldBeModel';
export const ABSTRACT_WITH_MODEL = 'abstractWithModel';
export const ABSTRACT_WITH_EMBEDDED = 'abstractWithEmbedded';

export const typeDef = gql`
  directive @abstract(from: String = null) on INTERFACE
`;

class Abstract extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    iface.mmAbstract = true;
    iface.mmAbstractTypes = [];

    Object.values(this.schema.getTypeMap())
      .filter(
        type => isObjectType(type) && type.getInterfaces().includes(iface)
      )
      .forEach((type: GraphQLObjectType) => {
        iface.mmAbstractTypes.push(type);
        // iface._addFromInterfaces(type);

        //validate usage
        if (!getDirective(type, 'model')) {
          throw new SDLSyntaxException(
            `
            Type '${type.name}' is inherited from abstract interface '${iface.name}' and should be marked with @model directive
          `,
            SHOULD_BE_MODEL,
            [type, iface]
          );
        }

        type
          .getInterfaces()
          .filter(i => i != iface)
          .forEach(i => {
            if (getDirective(i, 'model')) {
              throw new SDLSyntaxException(
                `Type '${type.name}' can not inherit both '${iface.name}' and '${i.name}' because they marked with @abstract and @model directives`,
                ABSTRACT_WITH_MODEL,
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
