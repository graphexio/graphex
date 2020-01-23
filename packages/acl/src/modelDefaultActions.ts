import {
  AMModelType,
  GraphQLOperationType,
  IAMMethodFieldFactory,
} from '@apollo-model/core/lib/definitions';
import { AMModelConnectionQueryFieldFactory } from '@apollo-model/core/lib/modelMethods/connectionQuery';
import { AMModelCreateMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/createMutation';
import { AMModelDeleteManyMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/deleteManyMutation';
import { AMModelDeleteOneMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/deleteOneMutation';
import { AMModelMultipleQueryFieldFactory } from '@apollo-model/core/lib/modelMethods/multipleQuery';
import { AMModelSingleQueryFieldFactory } from '@apollo-model/core/lib/modelMethods/singleQuery';
import { AMModelUpdateMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/updateMutation';
import { GraphQLNamedType, GraphQLSchema, GraphQLType } from 'graphql';
import R from 'ramda';
import { ACLRule } from './definitions';
import { extractAbstractTypes, matchingTypes, toEntries, toMap } from './utils';

function transformAccessToMethodFactories(
  access: string
): IAMMethodFieldFactory[] {
  return {
    R: [
      AMModelMultipleQueryFieldFactory,
      AMModelSingleQueryFieldFactory,
      AMModelConnectionQueryFieldFactory,
    ],
    C: [AMModelCreateMutationFieldFactory],
    D: [
      AMModelDeleteOneMutationFieldFactory,
      AMModelDeleteManyMutationFieldFactory,
    ],
    U: [AMModelUpdateMutationFieldFactory],
  }[access];
}

export function modelDefaultActions(modelPattern, access): ACLRule {
  return (schema: GraphQLSchema) => {
    const methodFactoryToSignatures = R.curry(
      (modelType: AMModelType, factory: IAMMethodFieldFactory) => {
        let operation =
          factory.getOperationType() === GraphQLOperationType.Query
            ? schema.getQueryType()
            : schema.getMutationType();

        let methodName = factory.getFieldName(modelType);
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
