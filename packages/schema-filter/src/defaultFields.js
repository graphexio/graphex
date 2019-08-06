import makeASTfromValue from './makeASTfromValue';

const reduceDefaults = (state, item) => {
  return { ...state, [item.field.name]: item.valueFn() };
};

export const appendFields = (argument, newFields) => {
  let { fields } = argument.value;
  return {
    ...argument,
    value: {
      ...argument.value,
      fields: [...fields, ...newFields],
    },
  };
};

export default () => {
  const defaults = {};

  const add = (type, field, valueFn) => {
    if (!defaults[type.name]) {
      defaults[type.name] = [];
    }
    defaults[type.name].push({
      field,
      valueFn,
    });
  };

  const get = type => {
    if (!defaults[type.name]) return undefined;
    let result = {};
    return defaults[type.name].reduce(reduceDefaults, {});
  };

  const applyDefaults = node => ({ type }) => {
    let defaultValues = get(type);
    if (defaultValues) {
      return appendFields(node, makeASTfromValue(defaultValues).fields);
    }
    return undefined;
  };

  return {
    add,
    get,
    applyDefaults,
  };
};
