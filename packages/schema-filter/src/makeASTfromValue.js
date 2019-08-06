import { Kind } from 'graphql';
import R from 'ramda';

// console.log(Kind);

export const makeASTfromValue_String = value => ({
  kind: Kind.STRING,
  value: value,
});

export const makeASTfromValue_Number = value => ({
  kind: Number.isInteger(value) ? Kind.INT : Kind.FLOAT,
  value: value,
});

const mapObjectField = ([name, value]) => ({
  kind: Kind.OBJECT_FIELD,
  name: { kind: Kind.NAME, value: name },
  value: makeASTfromValue(value),
});

export const makeASTfromValue_Object = value => {
  if (Array.isArray(value)) {
    return {
      kind: Kind.LIST,
      values: value.map(makeASTfromValue),
    };
  } else {
    return {
      kind: Kind.OBJECT,
      fields: value |> R.toPairs |> R.map(mapObjectField),
    };
  }
};

const strategies = {
  string: makeASTfromValue_String,
  object: makeASTfromValue_Object,
  number: makeASTfromValue_Number,
};

const makeASTfromValue = value => {
  return strategies[typeof value](value);
};

export default makeASTfromValue;
