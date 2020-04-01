import TypeWrap from '@apollo-model/type-wrap';
import { DirectiveNode, GraphQLUnionType } from 'graphql';
import { AMModelType, AMObjectType, IAMTypeFactory } from '../definitions';
import { getDirective } from '../utils';

function generateKeyDirective(fields) {
  return <DirectiveNode>{
    kind: 'Directive',
    name: { kind: 'Name', value: 'key' },
    arguments: [
      {
        kind: 'Argument',
        name: { kind: 'Name', value: 'fields' },
        value: {
          kind: 'StringValue',
          value: fields,
          block: false,
        },
      },
    ],
  };
}

export const AMFederationEntityTypeFactory: IAMTypeFactory<GraphQLUnionType> = {
  getTypeName(modelType): string {
    return `_Entity`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<GraphQLUnionType> = this;

    const keyTypes = [];
    // schema._directives = [...schema._directives, ...federationDirectives];

    Object.values(schemaInfo.schema.getTypeMap()).forEach(
      (type: AMModelType) => {
        //   this._onSchemaInit(type);

        const typeWrap = new TypeWrap(type);
        if (
          (getDirective(type, 'model') ||
            typeWrap.interfaceWithDirective('model')) &&
          !(typeWrap.isAbstract() || typeWrap.isInterface())
        ) {
          keyTypes.push(type);
        }
      }
    );

    return new GraphQLUnionType({
      name: '_Entity',
      types: keyTypes,
    });
  },
};
