import R from 'ramda';

import {
  GraphQLInputObjectType,
  GraphQLSchema,
  GraphQLNamedType,
  GraphQLField,
} from 'graphql';

import { AMCreateTypeFactory } from '@apollo-model/core/lib/inputTypes/create';
// import { AMCreateManyNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/createManyNested';
// import { AMCreateManyRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/createManyRelation';
// import { AMCreateOneNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/createOneNested';
// import { AMCreateOneRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/createOneRelation';
// import { AMCreateOneRequiredRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/createOneRequiredRelation';
// import { AMInterfaceCreateTypeFactory } from '@apollo-model/core/lib/inputTypes/interfaceCreate';
// import { AMInterfaceWhereTypeFactory } from '@apollo-model/core/lib/inputTypes/interfaceWhere';
// import { AMInterfaceWhereUniqueTypeFactory } from '@apollo-model/core/lib/inputTypes/interfaceWhereUnique';
// import { AMOrderByTypeFactory } from '@apollo-model/core/lib/inputTypes/orderBy';
import { AMUpdateTypeFactory } from '@apollo-model/core/lib/inputTypes/update';
// import { AMUpdateManyNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/updateManyNested';
// import { AMUpdateManyRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/updateManyRelation';
// import { AMUpdateOneNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/updateOneNested';
// import { AMUpdateOneRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/updateOneRelation';
// import { AMUpdateWithWhereNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/updateWithWhereNested';

import { AMWhereACLTypeFactory } from '@apollo-model/core/lib/inputTypes/whereACL';

import {
  AMModelType,
  IAMTypeFactory,
} from '@apollo-model/core/lib/definitions';
import { matchingTypes, extractAbstractTypes } from './utils';

function transformAccessToInputTypeFactories(
  access: string
): IAMTypeFactory<GraphQLInputObjectType>[] {
  return {
    R: [AMWhereACLTypeFactory],
    C: [AMCreateTypeFactory],
    U: [AMUpdateTypeFactory],
  }[access];
}

const inputTypeFactoryToInputRegExp = R.curry(
  (
    modelType: AMModelType,
    fieldName,
    inputTypeFactory: IAMTypeFactory<GraphQLInputObjectType>
  ) => {
    let inputName = inputTypeFactory
      ? inputTypeFactory.getTypeName(modelType)
      : modelType.name;
    return new RegExp(
      `^(?!Query|Mutation|Subscription)${inputName}\\.${fieldName}$`
    );
  }
);

const modelField = (typePattern, fieldName, access) => {
  const typeToRegExp = type =>
    R.pipe(
      R.split(''),
      R.chain(transformAccessToInputTypeFactories),
      R.map(inputTypeFactoryToInputRegExp(type, fieldName)),
      R.map(R.test)
    )(access);

  return ({
    type,
    field,
    schema,
  }: {
    type: GraphQLNamedType;
    field: GraphQLField<any, any, any>;
    schema: GraphQLSchema;
  }) => {
    let possibleTypes = R.pipe(
      matchingTypes(schema),
      extractAbstractTypes(schema)
    )(new RegExp(typePattern));

    const enableFields = R.chain(typeToRegExp, possibleTypes);

    let title = `${type.name}.${field.name}`;
    return R.anyPass(enableFields)(title);
  };
};

export const modelDefault = (modelName, fieldName, access, fn) => {
  return {
    cond: modelField(modelName, fieldName, access),
    fn,
  };
};
