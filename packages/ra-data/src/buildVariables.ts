import {
  getNamedType,
  GraphQLInputObjectType,
  GraphQLScalarType,
  IntrospectionInputObjectType,
  IntrospectionNamedTypeRef,
  IntrospectionObjectType,
  isEnumType,
  isScalarType,
  GraphQLInputType,
  GraphQLNamedType,
  GraphQLEnumType,
  isListType,
  isNonNullType,
} from 'graphql';
import isObject from 'lodash/isObject';
import * as R from 'ramda';
import {
  CREATE,
  DELETE,
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  GET_ONE,
  UPDATE,
} from 'react-admin';
import { IntrospectionResultData, Resource } from './definitions';
import { IntrospectionResult } from './introspectionResult';

interface GetListParams {
  filter: { [key: string]: any };
  pagination: { page: number; perPage: number };
  sort: { field: string; order: string };
}

//TODO: Object filter weren't tested yet
const buildGetListVariables = (
  introspectionResults: IntrospectionResultData
) => (resource: Resource, aorFetchType: string, params: GetListParams) => {
  const filter = Object.keys(params.filter).reduce((acc, key) => {
    if (key === 'ids') {
      return { ...acc, id_in: params.filter[key] };
    }

    if (Array.isArray(params.filter[key])) {
      const type = introspectionResults.types.find(
        t => t.name === `${resource.type.name}WhereInput`
      ) as IntrospectionInputObjectType;
      const inputField = type.inputFields.find((t: any) => t.name === key);

      if (!!inputField) {
        return {
          ...acc,
          [key]: params.filter[key],
        };
      }
    }

    if (isObject(params.filter[key])) {
      const type = introspectionResults.types.find(
        t => t.name === `${resource.type.name}WhereInput`
      ) as IntrospectionInputObjectType;
      const filterSome = type.inputFields.find(
        (t: any) => t.name === `${key}_some`
      );

      if (filterSome) {
        const filter = Object.keys(params.filter[key]).reduce(
          (acc, k: string) => ({
            ...acc,
            [`${k}_in`]: params.filter[key][k] as string[],
          }),
          {} as { [key: string]: string[] }
        );
        return { ...acc, [`${key}_some`]: filter };
      }
    }

    const parts = key.split('.');

    if (parts.length > 1) {
      if (parts[1] == 'id') {
        const type = introspectionResults.types.find(
          t => t.name === `${resource.type.name}WhereInput`
        ) as IntrospectionInputObjectType;
        const filterSome = type.inputFields.find(
          (t: any) => t.name === `${parts[0]}_some`
        );

        if (filterSome) {
          return {
            ...acc,
            [`${parts[0]}_some`]: { id: params.filter[key] },
          };
        }

        return { ...acc, [parts[0]]: { id: params.filter[key] } };
      }

      const resourceField = (resource.type as IntrospectionObjectType).fields.find(
        (f: any) => f.name === parts[0]
      )!;
      if ((resourceField.type as IntrospectionNamedTypeRef).name === 'Int') {
        return { ...acc, [key]: parseInt(params.filter[key]) };
      }
      if ((resourceField.type as IntrospectionNamedTypeRef).name === 'Float') {
        return { ...acc, [key]: parseFloat(params.filter[key]) };
      }
    }

    return { ...acc, [key]: params.filter[key] };
  }, {});

  return {
    skip: (params.pagination.page - 1) * params.pagination.perPage,
    first: params.pagination.perPage,
    orderBy: `${params.sort.field}_${params.sort.order}`,
    where: filter,
  };
};

interface UpdateParams {
  id: string;
  data: { [key: string]: any };
  previousData: { [key: string]: any };
}

const transformInput = (value, type: GraphQLInputType) => {
  if (isNonNullType(type)) {
    return transformInput(value, type.ofType);
  }

  if (isListType(type)) {
    return value.map(v => transformInput(v, type.ofType));
  }

  if (isScalarType(type) || isEnumType(type)) {
    return value;
  }

  if (
    type.name.endsWith('UpdateOneRelationInput') ||
    type.name.endsWith('CreateOneRelationInput') ||
    type.name.endsWith('CreateOneRequiredRelationInput') ||
    type.name.endsWith('CreateManyRelationInput')
  ) {
    if (value === null) return null;
    return transformInputObject({ connect: value }, type);
  }

  if (type.name.endsWith('UpdateManyRelationInput')) {
    if (value === null) return null;
    return transformInputObject({ reconnect: value }, type);
  }

  if (
    type.name.endsWith('UpdateOneNestedInput') ||
    type.name.endsWith('CreateOneNestedInput') ||
    type.name.endsWith('CreateManyNestedInput')
  ) {
    if (value === null) return null;
    return transformInputObject({ create: value }, type);
  }

  if (type.name.endsWith('UpdateManyNestedInput')) {
    if (value === null) return null;
    return transformInputObject({ recreate: value }, type);
  }

  if (type.name.endsWith('InterfaceWhereUniqueInput')) {
    let { __typename, ...restValue } = value;
    if (!__typename) {
      __typename = Object.keys(type.getFields())[0];
    }
    return transformInputObject({ [__typename]: restValue }, type);
  }

  if (type.name.endsWith('InterfaceCreateInput')) {
    const { __typename, ...restValue } = value;
    return transformInputObject({ [__typename]: restValue }, type);
  }

  if (
    type.name.endsWith('WhereUniqueInput') ||
    type.name.endsWith('CreateInput') ||
    type.name.endsWith('UpdateInput') ||
    type.name.endsWith('GeoJSONPointInput') ||
    type.name.endsWith('GeoJSONPolygonInput')
  ) {
    return transformInputObject(value, type);
  }
};

const transformInputObject = (
  data: { [key: string]: any },
  type: GraphQLInputObjectType
) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    try {
      const field = type.getFields()[key];

      if (!field) {
        return acc;
      }

      let resultValue = transformInput(value, field.type);

      if (resultValue !== undefined) {
        return {
          ...acc,
          [key]: resultValue,
        };
      } else {
        return acc;
      }
    } catch (err) {
      console.error(
        `Error during transformation of "${key}" field. Value: ${JSON.stringify(
          value
        )}. Error: ${err.toString()}`
      );
      return acc;
    }
  }, {} as { [key: string]: any });
};

const buildUpdateVariables = (
  introspectionResults: IntrospectionResultData,
  introspection: IntrospectionResult
) => (resource: Resource, aorFetchType: String, params: UpdateParams) => {
  const type = R.find(R.propEq('name', resource.type.name))(
    introspectionResults.types
  ) as IntrospectionObjectType;

  const updateType = introspection.getUpdateDataType(resource.type.name);
  const { id, ...restData } = params.data;

  const where = {
    id,
  };

  const data = transformInput(restData, updateType);

  return {
    where,
    data,
  };
};

interface CreateParams {
  data: { [key: string]: any };
}

const buildCreateVariables = (
  introspectionResults: IntrospectionResultData,
  introspection: IntrospectionResult
) => (resource: Resource, aorFetchType: String, params: UpdateParams) => {
  const type = R.find(R.propEq('name', resource.type.name))(
    introspectionResults.types
  ) as IntrospectionObjectType;

  const createType = introspection.getCreateDataType(resource.type.name);

  const data = transformInput(params.data, createType);

  return {
    data,
  };
};

export default (
  introspectionResults: IntrospectionResultData,
  introspection: IntrospectionResult
) => (resource: Resource, aorFetchType: string, params: any) => {
  switch (aorFetchType) {
    case GET_LIST: {
      return buildGetListVariables(introspectionResults)(
        resource,
        aorFetchType,
        params
      );
    }
    case GET_MANY:
      return {
        where: { id_in: params.ids },
      };
    case GET_MANY_REFERENCE: {
      const parts = params.target.split('.');

      return {
        where: { [parts[0]]: { id: params.id } },
      };
    }
    case GET_ONE:
      return {
        where: { id: params.id },
      };
    case UPDATE: {
      return buildUpdateVariables(introspectionResults, introspection)(
        resource,
        aorFetchType,
        params
      );
    }

    case CREATE: {
      return buildCreateVariables(introspectionResults, introspection)(
        resource,
        aorFetchType,
        params
      );
    }

    case DELETE:
      return {
        where: { id: params.id },
      };
  }
};
