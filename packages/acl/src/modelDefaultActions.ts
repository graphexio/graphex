import {
  AMMethodFieldFactory,
  AMModelType,
  GraphQLOperationType,
  defaultConfig,
} from '@apollo-model/core';

import { GraphQLSchema, GraphQLType } from 'graphql';
import R from 'ramda';
import { ACLRule } from './definitions';
import { extractAbstractTypes, matchingTypes, toEntries, toMap } from './utils';

function transformAccessToMethodFactories(
  access: string
): typeof AMMethodFieldFactory[] {
  return {
    R: [
      defaultConfig._default.methodFactories.multipleQuery.factory,
      defaultConfig._default.methodFactories.singleQuery.factory,
      defaultConfig._default.methodFactories.connectionQuery.factory,
    ],
    C: [defaultConfig._default.methodFactories.createMutation.factory],
    D: [
      defaultConfig._default.methodFactories.deleteOneMutation.factory,
      defaultConfig._default.methodFactories.deleteManyMutation.factory,
    ],
    U: [defaultConfig._default.methodFactories.updateMutation.factory],
  }[access];
}

export function modelDefaultActions(modelPattern, access): ACLRule {
  return (schema: GraphQLSchema) => {
    const methodFactoryToSignatures = R.curry(
      (modelType: AMModelType, factory: typeof AMMethodFieldFactory) => {
        let operation =
          factory.prototype.getOperationType() === GraphQLOperationType.Query
            ? schema.getQueryType()
            : schema.getMutationType();

        let methodName = factory.prototype.getFieldName(modelType);
        if (operation.getFields()[methodName]) {
          return [`${operation}.${methodName}`];
        } else {
          return [];
        }
      }
    );

    const typeToSignatures = (type: GraphQLType) =>
      R.pipe(
        R.split(''),
        R.chain(transformAccessToMethodFactories),
        R.chain(methodFactoryToSignatures(type as AMModelType))
      )(access);

    const enableFields = R.pipe(
      matchingTypes(schema),
      extractAbstractTypes(schema),
      R.chain(typeToSignatures),
      R.map(toEntries),
      toMap
    )(new RegExp(`^(?:${modelPattern})$`));

    return ({ type, field }) => {
      return enableFields.has(`${type.name}.${field.name}`);
    };
  };
}
