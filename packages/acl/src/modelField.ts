import { AMModelType } from '@apollo-model/core/lib/definitions';
import { AMInputTypeFactory, defaultConfig } from '@apollo-model/core';
import { GraphQLSchema } from 'graphql';
import R from 'ramda';
import { ACLRule } from './definitions';
import {
  extractAbstractTypes,
  matchingFields,
  matchingTypes,
  toEntries,
  toMap,
} from './utils';

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
      //defaultConfig._default.inputTypeFactories.createOneRelation.factory,
      //defaultConfig._default.inputTypeFactories.createManyRelation.factory,
      //defaultConfig._default.inputTypeFactories.createOneNested.factory,
      //defaultConfig._default.inputTypeFactories.createManyNested.factory,
      //defaultConfig._default.inputTypeFactories.createOneRequirerdRelation
      //  .factory,
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
    const isTypeExists = (typeName) => Boolean(schema.getType(typeName));
    const concatFieldName = (typeName) => {
      return matchingFields(
        schema,
        typeName,
        new RegExp(`^(?:${fieldName})$`)
      ).map((field) => `${typeName}.${field.name}`);
    };

    const typeToFieldSignature = (type) =>
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
