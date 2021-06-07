import TypeWrap from '@graphex/type-wrap';
import { GraphQLUnionType } from 'graphql';
import { AMModelType, IAMTypeFactory } from '../definitions';
import { getDirective } from '../utils';

export const AMFederationEntityTypeFactory: IAMTypeFactory<GraphQLUnionType> = {
  getTypeName(): string {
    return `_Entity`;
  },
  getType(modelType, schemaInfo) {
    const keyTypes = [];

    Object.values(schemaInfo.schema.getTypeMap()).forEach(
      (type: AMModelType) => {
        const typeWrap = new TypeWrap(type);
        if (
          ((getDirective(type, 'model') ||
            typeWrap.interfaceWithDirective('model')) &&
            !(typeWrap.isAbstract() || typeWrap.isInterface())) ||
          getDirective(type, 'federated')
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
