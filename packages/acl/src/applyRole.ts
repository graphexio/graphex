import { GraphQLSchema } from 'graphql';
import { applyRules } from './applyRules';
import { allQueries, allMutations, anyField } from './rules';
import { modelDefaultActions } from './modelDefaultActions';
import { modelField } from './modelField';
import { modelDefault } from './modelDefault';

type Role = {
  [typeName: string]: {
    filter?: any;
    read?: {
      allow?: boolean;
      fields?: {
        [fieldName: string]: {
          allow?: boolean;
        };
      };
    };
    create?: {
      allow?: boolean;
      fields?: {
        [fieldName: string]: {
          allow?: boolean;
          hydrate?: any;
        };
      };
    };
    update?: {
      allow?: boolean;
      fields?: {
        [fieldName: string]: {
          allow?: boolean;
          hydrate?: any;
        };
      };
    };
    delete?: {
      allow?: boolean;
    };
  };
};

const OperationToAccess = {
  create: 'C',
  read: 'R',
  update: 'U',
  delete: 'D',
};

export const applyRole = (schema: GraphQLSchema, role: Role) => {
  const denyRules = [];
  const defaults = [];
  const argsDefaults = [];

  Object.entries(role).forEach(([modelName, operations]) => {
    if ('filter' in operations) {
      const { filter } = operations;

      argsDefaults.push((schema) => ({
        cond: modelDefaultActions(modelName, 'RUD')(schema),
        fn: () => ({ where: {} }),
      }));

      defaults.push(
        modelDefault(modelName, 'aclWhere', 'R', ({ context }) => {
          return filter;
        })
      );
    }

    (['create', 'read', 'update', 'delete'] as const).forEach((op) => {
      if (op in operations) {
        const access = OperationToAccess[op];
        const operationData = operations[op];

        if (operationData.allow === false) {
          denyRules.push(modelDefaultActions(modelName, access));
        }

        if ('fields' in operationData) {
          Object.entries(operationData.fields).forEach(([fieldName, field]) => {
            if (field.allow === false) {
              denyRules.push(modelField(modelName, fieldName, access));
            }
            if ('hydrate' in field) {
              defaults.push(
                modelDefault(modelName, fieldName, access, ({ context }) => {
                  return field['hydrate'];
                })
              );
            }
          });
        }
      }
    });
  });

  return applyRules(schema, {
    allow: [allQueries, allMutations, anyField],
    deny: denyRules,
    defaults,
    argsDefaults,
  });
};
