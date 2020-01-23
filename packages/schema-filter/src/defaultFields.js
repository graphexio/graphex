import { valueFromAST, astFromValue } from 'graphql';
import R from 'ramda';

const reduceDefaults = (state, item) => {
  return { ...state, [item.field.name]: item.valueFn() };
};

export default () => {
  const defaults = {};
  const defaultArgs = {};

  const add = (type, field, valueFn) => {
    if (!defaults[type.name]) {
      defaults[type.name] = [];
    }
    defaults[type.name].push({
      field,
      valueFn,
    });
  };

  const addArg = (type, field, valueFn) => {
    if (!defaultArgs[type.name]) {
      defaultArgs[type.name] = {};
    }
    defaultArgs[type.name][field.name] = valueFn;
  };

  const get = type => {
    if (!defaults[type.name]) return undefined;
    return defaults[type.name].reduce(reduceDefaults, {});
  };

  const applyDefaults = (node, context) => ({ type }) => {
    let defaultValues = defaults[type.name];
    // let defaultValues = get(type);

    if (defaultValues) {
      const input = valueFromAST(node.value, type) || {};

      defaultValues.forEach(item => {
        input[item.field.name] = item.valueFn({
          input: input[item.field.name],
          context,
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

  const applyDefaultArgs = (node, context) => (parent, field) => {
    if (
      defaultArgs[parent.type.name] &&
      defaultArgs[parent.type.name][node.name.value]
    ) {
      const args = defaultArgs[parent.type.name][node.name.value]({ context });
      const newArguments = [...node.arguments];

      Object.entries(args).forEach(([argName, argValue]) => {
        try {
          const argType = R.find(R.propEq('name', argName))(
            parent.type.getFields()[node.name.value].args
          ).type;

          const astValue = astFromValue(argValue, argType);

          newArguments.push({
            kind: 'Argument',
            name: { kind: 'Name', value: argName },
            value: astValue,
          });
        } catch (err) {}
      });

      return {
        ...node,
        arguments: newArguments,
      };
    }
  };

  return {
    add,
    addArg,
    get,
    applyDefaults,
    applyDefaultArgs,
  };
};
