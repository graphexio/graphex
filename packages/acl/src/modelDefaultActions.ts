import { GraphQLNamedType } from 'graphql';

import { AMModelCreateMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/createMutation';
import { AMModelDeleteManyMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/deleteManyMutation';
import { AMModelDeleteOneMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/deleteOneMutation';
import { AMModelUpdateMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/updateMutation';
import { AMModelConnectionQueryFieldFactory } from '@apollo-model/core/lib/modelMethods/connectionQuery';
import { AMModelMultipleQueryFieldFactory } from '@apollo-model/core/lib/modelMethods/multipleQuery';
import { AMModelSingleQueryFieldFactory } from '@apollo-model/core/lib/modelMethods/singleQuery';
import {
  IAMMethodFieldFactory,
  AMModelType,
  GraphQLOperationType,
} from '@apollo-model/core/lib/definitions';

import { isInterfaceType } from 'graphql';

import R from 'ramda';

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

const methodFactoryToRegExp = R.curry(
  (modelType: AMModelType, factory: IAMMethodFieldFactory) => {
    let operation =
      factory.getOperationType() === GraphQLOperationType.Query
        ? 'Query'
        : 'Mutation';
    let method = factory.getFieldName(modelType);
    return new RegExp(`${operation}\\.${method}`);
  }
);

export const modelDefaultActions = (modelName, access) => {
  const typeToRegExp = (type: GraphQLNamedType) =>
    R.pipe(
      R.split(''),
      R.chain(transformAccessToMethodFactories),
      R.map(methodFactoryToRegExp(type as AMModelType)),
      R.map(R.test)
    )(access);

  return ({ type, field, schema }) => {
    let modelType = schema.getTypeMap()[modelName];
    if (!modelType) {
      return false;
    }
    let possibleTypes = [modelType];
    if (isInterfaceType(modelType)) {
      possibleTypes = [...possibleTypes, ...schema.getPossibleTypes(modelType)];
    }

    const enableFields = R.chain(typeToRegExp, possibleTypes);

    return R.anyPass(enableFields)(`${type.name}.${field.name}`);
  };
};
