import { defaultConfig } from '@apollo-model/core';

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
  const modelName = 'Brand';
  const rule = modelDefaultActions(modelName, permission)(schema);
  const modelType = schema.getType(modelName) as AMModelType;

  [
    defaultConfig._default.methodFactories.singleQuery.factory,
    defaultConfig._default.methodFactories.multipleQuery.factory,
    defaultConfig._default.methodFactories.connectionQuery.factory,
    defaultConfig._default.methodFactories.createMutation.factory,
    defaultConfig._default.methodFactories.deleteOneMutation.factory,
    defaultConfig._default.methodFactories.deleteManyMutation.factory,
    defaultConfig._default.methodFactories.updateMutation.factory,
  ].forEach((methodFactory, i) => {
    const type =
      methodFactory.prototype.getOperationType() === GraphQLOperationType.Query
        ? schema.getQueryType()
        : schema.getMutationType();

    const field = type.getFields()[
      methodFactory.prototype.getFieldName(modelType)
    ];

    expect(
      rule({
        type,
        field,
      })
    ).toBe(resultmask[i]);
  });
});
