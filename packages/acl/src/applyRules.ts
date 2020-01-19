import R from 'ramda';
import SchemaFilter from '@apollo-model/schema-filter';
const { transformSchema } = require('graphql-tools');

export const applyRules = (
  schema,
  { allow: allowRules = [], deny: denyRules = [], defaults = [] }
) => {
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
    }
  );

  return transformSchema(schema, [filterFields]);
};
