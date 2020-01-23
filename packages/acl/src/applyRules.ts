import R from 'ramda';
import SchemaFilter from '@apollo-model/schema-filter';
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

  let filterFields = SchemaFilter(
    (type, field) => {
      let allow = R.anyPass(allowRules)({ type, field, schema });
      let deny = R.anyPass(denyRules)({ type, field, schema });

      return allow && !deny;
    },
    (type, field) => {
      let defaultFn = defaults.find(item => item.cond({ type, field, schema }));
      if (!defaultFn) {
        return undefined;
      }
      return defaultFn.fn;
    },
    (type, field) => {
      let defaultFn = argsDefaults.find(item =>
        item.cond({ type, field, schema })
      );
      if (!defaultFn) {
        return undefined;
      }
      return defaultFn.fn;
    }
  );

  return transformSchema(schema, [filterFields]);
};
