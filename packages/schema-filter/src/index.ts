import {
  createResolveType,
  fieldMapToFieldConfigMap,
  inputFieldMapToFieldConfigMap,
} from '@apollo-model/graphql-tools/dist/stitching/schemaRecreation';
import {
  visitSchema,
  VisitSchemaKind,
} from '@apollo-model/graphql-tools/dist/transforms/visitSchema';
import TypeWrap from '@apollo-model/type-wrap';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  isInputObjectType,
  isObjectType,
  Kind,
  // visit,
  isScalarType,
  getNamedType,
  GraphQLList,
  typeFromAST,
  GraphQLNamedType,
} from 'graphql';

import * as R from 'ramda';
import DefaultFields from './defaultFields';
import { astFromValue } from '@apollo-model/ast-from-value';
import { visit } from './visitor';

const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const reduceArgs = (map, arg) => {
  map[arg.name] = arg;
  return map;
};

const getFields = stackItem => stackItem.type.getFields();
const getArgs = stackItem => stackItem.args;

const getNameValue = node => node.name.value;
const getFragmentTypeName = node => node.typeCondition.name.value;

const mapTypeForTypeStack = type => ({ type });

export const mapFieldForTypeStack = field => ({
  type: new TypeWrap(field.type).realType(),
  args: field.args.reduce(reduceArgs, {}),
});

const mapArgForTypeStack = arg => ({
  type: new TypeWrap(arg.type).realType(),
});

export const groupFields = (predicate, object) => {
  let result = {};
  for (let key in object) {
    let predicateValue = predicate(object[key]);
    if (!result[predicateValue]) result[predicateValue] = {};
    result[predicateValue][key] = object[key];
  }
  return result;
};

export const reduceValues = values => {
  return values.reduce((state, item) => {
    state[item.name] = R.omit(['deprecationReason', 'isDeprecated'], item);
    return state;
  }, {});
};

const resolveType = createResolveType((typeName, type) => {
  return type;
});

export default (filterFields, defaultFields, defaultArgs) => {
  let typeMap = {};
  let Schema;
  const getType = typeName => typeMap[typeName];

  let defaults = DefaultFields();

  return {
    async transformRequest(request, options: { context?: any } = {}) {
      let variableTypes = {};
      const { variables } = request;
      const typeStack = [];
      const typeStackPush = item => typeStack.push(item);

      const visitor = {
        // enter(node) {
        //   console.log('enter', node);
        // },
        // leave(node) {
        //   console.log('leave', node);
        // },
        [Kind.OPERATION_DEFINITION]: {
          enter: node => {
            R.pipe(
              capitalizeFirstLetter,
              getType,
              mapTypeForTypeStack,
              typeStackPush
            )(node.operation);
          },
          leave: node => {
            typeStack.pop();
          },
        },
        [Kind.FIELD]: {
          enter: node => {
            let name = getNameValue(node);

            if (name == '__typename') return;

            R.pipe(
              R.last,
              getFields,
              R.prop(name),
              mapFieldForTypeStack,
              typeStackPush
            )(typeStack);

            return defaults.applyDefaultArgs(
              node,
              variables,
              options.context
            )(R.head(R.takeLast(2, typeStack)), R.last(typeStack));
          },
          leave: node => {
            let name = getNameValue(node);
            if (name == '__typename') return;
            const type = typeStack.pop();
            // return
          },
        },
        [Kind.INLINE_FRAGMENT]: {
          enter: node => {
            let name = getFragmentTypeName(node);
            R.pipe(getType, mapTypeForTypeStack, typeStackPush)(name);
          },
          leave: node => {
            typeStack.pop();
          },
        },
        [Kind.ARGUMENT]: {
          enter: node => {
            if (
              node.value.kind === Kind.VARIABLE &&
              !variables[node.value.name.value]
            ) {
              return null;
            }

            R.pipe(
              R.last,
              getArgs,
              R.prop(getNameValue(node)),
              mapArgForTypeStack,
              typeStackPush
            )(typeStack);
          },
          leave: node => {
            return defaults.applyDefaults(
              node,
              variables,
              options.context
            )(typeStack.pop());
          },
        },
        [Kind.OBJECT_FIELD]: {
          enter: node => {
            if (
              node.value.kind === Kind.VARIABLE &&
              !variables[node.value.name.value]
            ) {
              return null;
            }

            R.pipe(
              R.last,
              getFields,
              R.prop(getNameValue(node)),
              mapArgForTypeStack,
              typeStackPush
            )(typeStack);
          },
          leave: node => {
            return defaults.applyDefaults(
              node,
              variables,
              options.context
            )(typeStack.pop());
          },
        },
        [Kind.VARIABLE_DEFINITION]: {
          enter(node) {
            const type = typeFromAST(Schema, node.type);
            variableTypes[node.variable.name.value] = type;
            return null;
          },
          leave(node) {},
        },
        [Kind.VARIABLE]: {
          enter(node) {
            const type = variableTypes[node.name.value];
            const newNode = astFromValue(
              variables[node.name.value] ? variables[node.name.value] : null,
              type
            );
            if (!newNode) return null;

            if (newNode && newNode.kind && visitor[newNode.kind]) {
              visitor[newNode.kind].enter(newNode);
            } // TODO: test it! Kind.OBJECT?

            return newNode;
          },
        },
      };

      try {
        let newDocument = await visit(request.document, visitor);

        return {
          ...request,
          document: newDocument,
        };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },

    transformSchema(schema) {
      Schema = schema;
      defaults = DefaultFields();

      let newSchema = visitSchema(schema, {
        [VisitSchemaKind.OBJECT_TYPE]: (type: GraphQLObjectType) => {
          const groupedFields = groupFields(
            field => filterFields(type, field),
            type.getFields()
          );

          if (!groupedFields['false']) {
            return undefined;
          }
          if (!groupedFields['true']) return null;

          const interfaces = type.getInterfaces();

          return new GraphQLObjectType({
            name: type.name,
            description: type.description,
            astNode: type.astNode,
            isTypeOf: type.isTypeOf,
            fields: () =>
              fieldMapToFieldConfigMap(
                groupedFields['true'],
                resolveType,
                true
              ),
            interfaces: () => interfaces,
          });
        },
        [VisitSchemaKind.INPUT_OBJECT_TYPE]: (type: GraphQLInputObjectType) => {
          const groupedFields = groupFields(
            field => filterFields(type, field),
            type.getFields()
          );

          if (!groupedFields['false']) {
            return undefined;
          }

          if (!groupedFields['true']) return null;

          return new GraphQLInputObjectType({
            name: type.name,
            description: type.description,
            astNode: type.astNode,
            // isTypeOf: type.isTypeOf,
            fields: () =>
              inputFieldMapToFieldConfigMap(groupedFields['true'], resolveType),
          });
        },
        [VisitSchemaKind.ENUM_TYPE]: (type: GraphQLEnumType) => {
          const groupedFields = groupFields(
            field => filterFields(type, field),
            reduceValues(type.getValues())
          );

          if (!groupedFields['false']) {
            return undefined;
          }
          if (!groupedFields['true']) return null;

          return new GraphQLEnumType({
            name: type.name,
            description: type.description,
            astNode: type.astNode,
            values: groupedFields['true'],
          });

          return undefined;
        },
        [VisitSchemaKind.INTERFACE_TYPE]: (type: GraphQLInterfaceType) => {
          const groupedFields = groupFields(
            field => filterFields(type, field),
            type.getFields()
          );

          if (!groupedFields['false']) {
            return undefined;
          }
          // else {
          //   Object.values(groupedFields[false]).forEach(field => {
          //     let defaultFn = defaultFields(type, field);
          //     if (defaultFn) {
          //       defaults.add(type, field, defaultFn);
          //     } else {
          //       if (new TypeWrap(field.type).isRequired()) {
          //         throw new Error(
          //           `Default value for required field "${field.name}" in type "${type.name}" was not provided`
          //         );
          //       }
          //     }
          //   });
          //

          if (!groupedFields['true']) return null;

          return new GraphQLInterfaceType({
            name: type.name,
            // description: type.description,
            astNode: type.astNode,
            // isTypeOf: type.isTypeOf,
            fields: () =>
              fieldMapToFieldConfigMap(
                groupedFields['true'],
                resolveType,
                undefined
              ),
          });

          return undefined;
        },
      });

      //remove null from interfaces after first transformation
      newSchema = visitSchema(newSchema, {
        [VisitSchemaKind.OBJECT_TYPE]: (type: GraphQLObjectType) => {
          const interfaces = type.getInterfaces();
          let filteredInterfaces = interfaces.filter(iface => iface);

          if (filteredInterfaces.length === interfaces.length) {
            return undefined;
          }

          const fields = type.getFields();

          return new GraphQLObjectType({
            name: type.name,
            description: type.description,
            astNode: type.astNode,
            isTypeOf: type.isTypeOf,
            fields: () => fieldMapToFieldConfigMap(fields, resolveType, true),
            interfaces: () => filteredInterfaces,
          });

          return undefined;
        },
      });

      // visitSchema remove type if every field has been removed. But is doesn't remove types recursively
      let smthRemoved;
      do {
        smthRemoved = false;

        newSchema = visitSchema(newSchema, {
          [VisitSchemaKind.OBJECT_TYPE]: (type: GraphQLObjectType) => {
            if (Object.keys(type.getFields()).length === 0) {
              smthRemoved = true;
              return null;
            }
            return undefined;
          },
          [VisitSchemaKind.INPUT_OBJECT_TYPE]: (
            type: GraphQLInputObjectType
          ) => {
            if (Object.keys(type.getFields()).length === 0) {
              smthRemoved = true;
              return null;
            }
            return undefined;
          },
          [VisitSchemaKind.INTERFACE_TYPE]: (type: GraphQLInterfaceType) => {
            if (Object.keys(type.getFields()).length === 0) {
              smthRemoved = true;
              return null;
            }
            return undefined;
          },
        });
      } while (smthRemoved);

      Object.values(schema.getTypeMap()).forEach((type: GraphQLNamedType) => {
        if (type.name.startsWith('__')) return;
        if (isObjectType(type) || isInputObjectType(type)) {
          Object.values(type.getFields()).forEach(field => {
            // if (
            //   !newSchema.getTypeMap()[type.name] ||
            //   !newSchema.getTypeMap()[type.name].getFields()[field.name]
            // ) {
            let defaultFn = defaultFields(type, field);
            if (defaultFn) {
              defaults.add(type, field, defaultFn);
            }
            // if (
            //   new TypeWrap(field.type).isRequired() &&
            //   !defaultFn &&
            //   (!newSchema.getTypeMap()[type.name] ||
            //     !newSchema.getTypeMap()[type.name].getFields()[field.name])
            // ) {
            //   throw new Error(
            //     `Default value for required field "${field.name}" in type "${type.name}" was not provided`
            //   );
            // }

            if (defaultArgs) {
              let defaultArgsFn = defaultArgs(type, field);
              if (defaultArgsFn) {
                defaults.addArg(type, field, defaultArgsFn);
              }
            }
            // }
          });
        }
      });

      typeMap = schema.getTypeMap();
      return newSchema;
    },
  };
};
