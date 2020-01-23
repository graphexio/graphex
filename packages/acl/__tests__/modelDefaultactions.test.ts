import { AMModelCreateMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/createMutation';
import { AMModelDeleteManyMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/deleteManyMutation';
import { AMModelDeleteOneMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/deleteOneMutation';
import { AMModelUpdateMutationFieldFactory } from '@apollo-model/core/lib/modelMethods/updateMutation';
import { AMModelConnectionQueryFieldFactory } from '@apollo-model/core/lib/modelMethods/connectionQuery';
import { AMModelMultipleQueryFieldFactory } from '@apollo-model/core/lib/modelMethods/multipleQuery';
import { AMModelSingleQueryFieldFactory } from '@apollo-model/core/lib/modelMethods/singleQuery';

import AMM from '@apollo-model/core';

import { modelDefaultActions, modelField } from '../src';
import gql from 'graphql-tag';
import {
  GraphQLOperationType,
  AMModelType,
} from '@apollo-model/core/lib/definitions';

const schema = new AMM({}).makeExecutableSchema({
  typeDefs: gql`
    type Brand @model {
      id: ID @id
      title: String
    }
  `,
});

test.each([
  ['C', [false, false, false, true, false, false, false]],
  ['R', [true, true, true, false, false, false, false]],
  ['U', [false, false, false, false, false, false, true]],
  ['D', [false, false, false, false, true, true, false]],
])('modelAccess %s', (permission, resultmask) => {
  let modelName = 'Brand';
  let rule = modelDefaultActions(modelName, permission)(schema);
  let modelType = schema.getType(modelName) as AMModelType;

  [
    AMModelSingleQueryFieldFactory,
    AMModelMultipleQueryFieldFactory,
    AMModelConnectionQueryFieldFactory,
    AMModelCreateMutationFieldFactory,
    AMModelDeleteOneMutationFieldFactory,
    AMModelDeleteManyMutationFieldFactory,
    AMModelUpdateMutationFieldFactory,
  ].forEach((methodFactory, i) => {
    const type =
      methodFactory.getOperationType() === GraphQLOperationType.Query
        ? schema.getQueryType()
        : schema.getMutationType();

    const field = type.getFields()[methodFactory.getFieldName(modelType)];

    expect(
      rule({
        type,
        field,
      })
    ).toBe(resultmask[i]);
  });
});
