import R from 'ramda';

import {
  GraphQLInputObjectType,
  GraphQLSchema,
  GraphQLNamedType,
  GraphQLField,
  GraphQLType,
  GraphQLInputType,
  GraphQLScalarType,
  GraphQLEnumType,
} from 'graphql';

import { AMCreateTypeFactory } from '@apollo-model/core/lib/inputTypes/create';
import { AMCreateManyNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/createManyNested';
import { AMCreateManyRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/createManyRelation';
import { AMCreateOneNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/createOneNested';
import { AMCreateOneRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/createOneRelation';
import { AMCreateOneRequiredRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/createOneRequiredRelation';
import { AMInterfaceCreateTypeFactory } from '@apollo-model/core/lib/inputTypes/interfaceCreate';
import { AMInterfaceWhereTypeFactory } from '@apollo-model/core/lib/inputTypes/interfaceWhere';
import { AMInterfaceWhereUniqueTypeFactory } from '@apollo-model/core/lib/inputTypes/interfaceWhereUnique';
import { AMOrderByTypeFactory } from '@apollo-model/core/lib/inputTypes/orderBy';
import { AMUpdateTypeFactory } from '@apollo-model/core/lib/inputTypes/update';
import { AMUpdateManyNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/updateManyNested';
import { AMUpdateManyRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/updateManyRelation';
import { AMUpdateOneNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/updateOneNested';
import { AMUpdateOneRelationTypeFactory } from '@apollo-model/core/lib/inputTypes/updateOneRelation';
import { AMUpdateWithWhereNestedTypeFactory } from '@apollo-model/core/lib/inputTypes/updateWithWhereNested';
import { AMWhereTypeFactory } from '@apollo-model/core/lib/inputTypes/where';
import { AMWhereACLTypeFactory } from '@apollo-model/core/lib/inputTypes/whereACL';
import { AMWhereCleanTypeFactory } from '@apollo-model/core/lib/inputTypes/whereClean';
import { AMWhereUniqueTypeFactory } from '@apollo-model/core/lib/inputTypes/whereUnique';
import {
  AMModelType,
  IAMTypeFactory,
} from '@apollo-model/core/lib/definitions';
import {
  matchingTypes,
  extractAbstractTypes,
  matchingFields,
  toEntries,
  toMap,
} from './utils';
import { ACLRule } from './definitions';
import {
  defaultConfig,
  AMTypeFactory,
  AMInputTypeFactory,
} from '@apollo-model/core/src';

function transformAccessToInputTypeFactories(
  access: string
): typeof AMInputTypeFactory[] {
  return {
    R: [
      null, //base type
      defaultConfig._default.inputTypeFactories.interfaceWhere.factory,
      defaultConfig._default.inputTypeFactories.interfaceWhereUnique.factory,
      defaultConfig._default.inputTypeFactories.orderBy.factory,
      defaultConfig._default.inputTypeFactories.where.factory,
      defaultConfig._default.inputTypeFactories.whereClean.factory,
      defaultConfig._default.inputTypeFactories.whereUnique.factory,
    ],
    C: [
      defaultConfig._default.inputTypeFactories.create.factory,
      defaultConfig._default.inputTypeFactories.interfaceCreate.factory,
      defaultConfig._default.inputTypeFactories.createOneRelation.factory,
      defaultConfig._default.inputTypeFactories.createManyRelation.factory,
      defaultConfig._default.inputTypeFactories.createOneNested.factory,
      defaultConfig._default.inputTypeFactories.createManyNested.factory,
      defaultConfig._default.inputTypeFactories.createOneRequirerdRelation
        .factory,
    ],
    U: [
      defaultConfig._default.inputTypeFactories.updateWithWhereNested.factory,
      defaultConfig._default.inputTypeFactories.updateOneRelation.factory,
      defaultConfig._default.inputTypeFactories.updateManyRelation.factory,
      defaultConfig._default.inputTypeFactories.updateOneNested.factory,
      defaultConfig._default.inputTypeFactories.updateManyNested.factory,
      defaultConfig._default.inputTypeFactories.update.factory,
    ],
  }[access];
}

const typeNameFromFactory = R.curry(
  (modelType: AMModelType, inputTypeFactory: typeof AMInputTypeFactory) => {
    return inputTypeFactory
      ? inputTypeFactory.prototype.getTypeName(modelType)
      : modelType.name;
  }
);

export function modelField(typePattern, fieldName, access): ACLRule {
  return (schema: GraphQLSchema) => {
    const isTypeExists = typeName => Boolean(schema.getType(typeName));
    const concatFieldName = typeName => {
      return matchingFields(
        schema,
        typeName,
        new RegExp(`^(?:${fieldName})$`)
      ).map(field => `${typeName}.${field.name}`);
    };

    const typeToFieldSignature = type =>
      R.pipe(
        R.split(''),
        R.chain(transformAccessToInputTypeFactories),
        R.map(typeNameFromFactory(type)),
        R.filter(isTypeExists),
        R.chain(concatFieldName)
      )(access);

    const enableFields = R.pipe(
      matchingTypes(schema),
      extractAbstractTypes(schema),
      R.chain(typeToFieldSignature),
      R.map(toEntries),
      toMap
    )(new RegExp(`^(?:${typePattern})$`));

    return ({ type, field }) => {
      return enableFields.has(`${type.name}.${field.name}`);
    };
  };
}
