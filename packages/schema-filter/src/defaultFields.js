import { valueFromAST, astFromValue, Kind } from 'graphql';
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

  const valueFromFieldNode = (typeFields, variables) => fieldNode => {
    const fieldName = fieldNode.name.value;
    const fieldType = typeFields[fieldName].type;
    const value = valueFromAST(fieldNode.value, fieldType, variables);
    return [fieldName, value];
  };

  const applyDefaults = (node, variables, context) => ({ type }) => {
    let defaultValues = defaults[type.name];

    // let defaultValues = get(type);

    if (defaultValues) {
      if (node && node.value && node.value.kind === Kind.LIST) {
        //TODO: make some kind of case based on Kind
        const newNode = {
          ...node,
          value: {
            kind: 'ListValue',
            values: node.value.values.map(val => {
              return applyDefaults({ value: val }, variables, context)({ type })
                .value;
            }),
          },
        };
        return newNode;
      }

      const typeFields = type.getFields();
      let input;
      if (!node.value) return undefined;

      if (node && node.value && node.value.kind === 'Variable') {
        input = variables[node.value.name.value] || {};
      } else {
        input = R.pipe(
          R.map(valueFromFieldNode(typeFields, variables)),
          R.fromPairs
        )(node.value.fields);
      }

      defaultValues.forEach(item => {
        input[item.field.name] = item.valueFn({
          input: input[item.field.name],
          parent: input,
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

  const applyDefaultArgs = (node, variables, context) => (parent, field) => {
    if (
      defaultArgs[parent.type.name] &&
      defaultArgs[parent.type.name][node.name.value]
    ) {
      const inputArgs = node.arguments
        //Filter undefined variables
        .filter(argNode => {
          if (
            argNode.value.kind === Kind.VARIABLE &&
            !variables[argNode.value.name.value]
          ) {
            return false;
          }
          return true;
        })
        .map(R.path(['name', 'value']));

      const args = R.pipe(
        R.path([parent.type.name, node.name.value]),
        R.applyTo({ context }),
        R.omit(inputArgs)
      )(defaultArgs);

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
