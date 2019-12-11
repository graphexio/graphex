import {
  GraphQLInt,
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLNamedType,
} from 'graphql';
import {
  AMModelField,
  AMModelType,
  AMResolveFactoryType,
  IAMTypeFactory,
} from '../definitions';
import TypeWrap from '@apollo-model/type-wrap';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';

export const relationDirective = (schema: GraphQLSchema) => {
  const resolveType = (typeName: string) => {
    return schema.getType(typeName);
  };

  const resolveFactoryType: AMResolveFactoryType = <T extends GraphQLNamedType>(
    modelType: AMModelType,
    typeFactory: IAMTypeFactory<T>
  ) => {
    const typeName = typeFactory.getTypeName(modelType);
    let type = schema.getType(typeName) as T;
    if (!type) {
      type = typeFactory.getType(modelType, {
        schema,
        resolveType,
        resolveFactoryType,
      });
      schema.getTypeMap()[typeName] = type;
    }
    return type;
  };

  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation) {
          const typeWrap = new TypeWrap(field.type);
          const realType = typeWrap.realType() as AMModelType;

          field.args = [
            {
              name: 'where',
              description: null,
              type: resolveFactoryType(realType, AMWhereTypeFactory),
              defaultValue: undefined,
            },
            {
              name: 'orderBy',
              description: null,
              type: resolveFactoryType(realType, AMOrderByTypeFactory),
              defaultValue: undefined,
            },
            {
              name: 'skip',
              description: null,
              type: GraphQLInt,
              defaultValue: undefined,
            },
            {
              name: 'first',
              description: null,
              type: GraphQLInt,
              defaultValue: undefined,
            },
          ];
        }
      });
    }
  });
};
