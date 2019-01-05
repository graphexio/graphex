import {
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLBoolean,
  GraphQLFloat,
} from 'graphql';

import Scalars from './scalars';

import { combineResolvers as CombineResolvers } from 'graphql-resolvers';

import _ from 'lodash';
import pluralize from 'pluralize';

export function getLastType(fieldType) {
  if (fieldType.ofType) {
    return getLastType(fieldType.ofType);
  }
  return fieldType;
}

export function getDirective(field, name) {
  if (field.astNode && field.astNode.directives) {
    return _.find(
      field.astNode.directives,
      directive => directive.name.value == name
    );
  }
  return undefined;
}

export function getDirectiveArg(directive, name, defaultValue) {
  let arg = _.find(
    directive.arguments,
    argument => argument.name.value == name
  );
  if (arg) return arg.value.value;
  else {
    return defaultValue;
  }
}

function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function getRelationFieldName(collection, field, many = false) {
  field = field.replace('_', '');
  if (many) {
    field = pluralize(field);
  }
  return camelize(`${collection} ${field}`);
}

export function hasQLListType(fieldType) {
  if (fieldType instanceof GraphQLList) {
    return true;
  }
  if (fieldType.ofType) {
    return hasQLListType(fieldType.ofType);
  }
  return false;
}

export function hasQLNonNullType(fieldType) {
  if (fieldType instanceof GraphQLNonNull) {
    return true;
  }
  if (fieldType.ofType) {
    return hasQLListType(fieldType.ofType);
  }
  return false;
}

export function cloneSchema(schema, type) {
  if (schema instanceof GraphQLNonNull) {
    return new GraphQLNonNull(cloneSchema(schema.ofType, type));
  }
  if (schema instanceof GraphQLList) {
    return new GraphQLList(cloneSchema(schema.ofType, type));
  }
  return type;
}

export function cloneSchemaOptional(schema, type) {
  if (schema instanceof GraphQLNonNull) {
    return cloneSchema(schema.ofType, type);
  }
  if (schema instanceof GraphQLList) {
    return new GraphQLList(cloneSchema(schema.ofType, type));
  }
  return type;
}

export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function allQueryArgs({ whereType, orderByType }) {
  return [
    {
      name: 'where',
      description: null,
      type: whereType,
      defaultValue: undefined,
    },
    {
      name: 'orderBy',
      description: null,
      type: orderByType,
      defaultValue: undefined,
    },
    {
      name: 'skip',
      description: null,
      type: GraphQLInt,
      defaultValue: undefined,
    },
    {
      name: 'first',
      description: null,
      type: GraphQLInt,
      defaultValue: undefined,
    },
  ];
}

export function GraphQLTypeFromString(type) {
  switch (type) {
    case 'ID':
      return GraphQLID;
    case 'Int':
      return GraphQLInt;
    case 'String':
      return GraphQLString;
    case 'ObjectID':
      return Scalars.ObjectID;
  }
}

export function combineResolvers(...args) {
  args = args.filter(arg => arg);
  return CombineResolvers(...args);
}

// export function getInputTypeName(TypeName, inputType) {
//   return `${TypeName}${inputType.charAt(0).toUpperCase() +
//     inputType.slice(1)}Input`;
//   // switch (inputType) {
//   //   case 'where':
//   //
//   //   case 'create':
//   //     return `${TypeName}CreateInput`;
//   //   case 'orderBy':
//   //     return `${TypeName}OrderByInput`;
//   // }
//   // return `${TypeName}Input`;
// }

// export function isGraphQLScalarType(type) {
//   return [
//     GraphQLID,
//     GraphQLInt,
//     GraphQLFloat,
//     GraphQLString,
//     GraphQLBoolean,
//   ].includes(type);
// }
//
// export function addResolveMapFilterToSelector(field, defaultName, modifier) {
//   const { resolveMapFilterToSelector } = field;
//   field.resolveMapFilterToSelector = async function(params) {
//     if (resolveMapFilterToSelector) {
//       params = await resolveMapFilterToSelector(params);
//     }
//     return params.map(({ fieldName = defaultName, value }) => {
//       return {
//         fieldName,
//         value: mapModifier(modifier, value),
//       };
//     });
//   };
//   return field;
// }
//
// function mapModifier(modifier, value) {
//   switch (modifier) {
//     case '':
//       return value;
//     case 'not':
//       return { $not: { $eq: value } };
//     case 'lt':
//     case 'lte':
//     case 'gt':
//     case 'gte':
//       return { [`$${modifier}`]: value };
//     case 'in':
//     case 'some':
//       return { $in: value };
//     case 'every':
//       return { $all: value };
//     case 'none':
//     case 'not_in':
//       return { $nin: value };
//     case 'contains':
//       return { $regex: `.*${value}.*` };
//     case 'contains':
//       return { $regex: `.*${value}.*` };
//       break;
//     case 'not_contains':
//       return { $not: { $regex: `.*${value}.*` } };
//     case 'starts_with':
//       return { $regex: `.*${value}` };
//     case 'not_starts_with':
//       return { $not: { $regex: `.*${value}` } };
//     case 'ends_with':
//       return { $regex: `${value}.*` };
//     case 'not_ends_with':
//       return { $not: { $regex: `${value}.*` } };
//     case 'exists':
//       return { $exists: value };
//     case 'near':
//       return {
//         $near: {
//           $geometry: value.geometry,
//           $minDistance: value.minDistance,
//           $maxDistance: value.maxDistance,
//         },
//       };
//     default:
//       return {};
//   }
// }
