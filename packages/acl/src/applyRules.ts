import R from 'ramda';
import { SchemaFilter, removeUnusedTypes } from '@apollo-model/schema-filter';
import { transformSchema } from '@apollo-model/graphql-tools';

export const applyRules = (
  schema,
  {
    allow: allowRules = [],
    deny: denyRules = [],
    defaults = [],
    argsDefaults = [],
  }
) => {
  const prepareRules = rules => rules.map(rule => rule(schema));

  allowRules = prepareRules(allowRules);
  denyRules = prepareRules(denyRules);
  defaults = prepareRules(defaults);
  argsDefaults = prepareRules(argsDefaults);

  const filterFields = SchemaFilter({
    filterFields: (type, field) => {
      const allow = R.anyPass(allowRules)({ type, field, schema });
      const deny = R.anyPass(denyRules)({ type, field, schema });

      return allow && !deny;
    },
    defaultFields: (type, field) => {
      const defaultFn = defaults.find(item =>
        item.cond({ type, field, schema })
      );
      if (!defaultFn) {
        return undefined;
      }
      return defaultFn.fn;
    },
    defaultArgs: (type, field) => {
      const defaultFn = argsDefaults.find(item =>
        item.cond({ type, field, schema })
      );
      if (!defaultFn) {
        return undefined;
      }
      return defaultFn.fn;
    },
  });

  return removeUnusedTypes(transformSchema(schema, [filterFields]));
};
