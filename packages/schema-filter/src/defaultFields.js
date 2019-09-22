import { valueFromAST, astFromValue } from 'graphql';

const reduceDefaults = (state, item) => {
  return { ...state, [item.field.name]: item.valueFn() };
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
    return defaults[type.name].reduce(reduceDefaults, {});
  };

  const applyDefaults = node => ({ type }) => {
    let defaultValues = defaults[type.name];
    // let defaultValues = get(type);

    if (defaultValues) {
      const input = valueFromAST(node.value, type) || {};

      defaultValues.forEach(item => {
        input[item.field.name] = item.valueFn({
          input: input[item.field.name],
        });
      });

      let newNode = {
        ...node,
        value: astFromValue(input, type),
      };

      return newNode;
    }
    return undefined;
  };

  return {
    add,
    get,
    applyDefaults,
  };
};
