import R from 'ramda';
import { INPUT_TYPE_KIND } from '@apollo-model/core/lib/inputTypes/kinds.js';
import { getInputTypeName } from '@apollo-model/core/lib/inputTypes/';

const transformAccessToInputKinds = access => {
  return {
    R: [
      null, //base type
      INPUT_TYPE_KIND.WHERE,
      INPUT_TYPE_KIND.WHERE_UNIQUE,
      INPUT_TYPE_KIND.ORDER_BY,
      INPUT_TYPE_KIND.WHERE_INTERFACE,
      INPUT_TYPE_KIND.WHERE_UNIQUE_INTERFACE,
    ],
    C: [
      INPUT_TYPE_KIND.CREATE,
      INPUT_TYPE_KIND.CREATE_INTERFACE,
      INPUT_TYPE_KIND.CREATE_ONE_NESTED,
      INPUT_TYPE_KIND.CREATE_MANY_NESTED,
      INPUT_TYPE_KIND.CREATE_ONE_REQUIRED_NESTED,
      INPUT_TYPE_KIND.CREATE_MANY_REQUIRED_NESTED,
    ],

    U: [
      INPUT_TYPE_KIND.UPDATE,
      INPUT_TYPE_KIND.UPDATE_INTERFACE,
      INPUT_TYPE_KIND.UPDATE_ONE_NESTED,
      INPUT_TYPE_KIND.UPDATE_MANY_NESTED,
      INPUT_TYPE_KIND.UPDATE_ONE_REQUIRED_NESTED,
      INPUT_TYPE_KIND.UPDATE_MANY_REQUIRED_NESTED,
      INPUT_TYPE_KIND.UPDATE_WITH_WHERE_NESTED,
    ],
  }[access];
};

const kindToInputRegExp = R.curry((modelName, fieldName, inputKind) => {
  let inputName = inputKind
    ? getInputTypeName(inputKind, modelName)
    : modelName;
  return new RegExp(
    `^(?!Query|Mutation|Subscription)${inputName}\\.${fieldName}$`
  );
});

export const modelField = (modelName, fieldName, access) => {
  let enableFields = R.pipe(
    R.split(''),
    R.chain(transformAccessToInputKinds),
    R.map(kindToInputRegExp(modelName, fieldName)),
    R.map(R.test)
  )(access);

  return ({ type, field }) => {
    let title = `${type.name}.${field.name}`;
    return R.anyPass(enableFields)(title);
  };
};
