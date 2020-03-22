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
  GraphQLNamedType,
  GraphQLObjectType,
  isInputObjectType,
  isObjectType,
} from 'graphql';
import * as R from 'ramda';
import DefaultFields from './defaultFields';

const reduceArgs = (map, arg) => {
  map[arg.name] = arg;
  return map;
};

export const mapFieldForTypeStack = field => ({
  type: new TypeWrap(field.type).realType(),
  args: field.args.reduce(reduceArgs, {}),
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

export const transformSchema = (
  { filterFields, defaultFields, defaultArgs },
  transformContext
) => schema => {
  transformContext.initialSchema = schema;
  transformContext.defaults = DefaultFields();

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
          fieldMapToFieldConfigMap(groupedFields['true'], resolveType, true),
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
      [VisitSchemaKind.INPUT_OBJECT_TYPE]: (type: GraphQLInputObjectType) => {
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
          transformContext.defaults.add(type, field, defaultFn);
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
            transformContext.defaults.addArg(type, field, defaultArgsFn);
          }
        }
        // }
      });
    }
  });

  return newSchema;
};
