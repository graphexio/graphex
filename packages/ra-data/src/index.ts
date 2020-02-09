import { ApolloClient, ApolloClientOptions } from 'apollo-client';
import merge from 'lodash/merge';
import buildDataProvider from 'ra-data-graphql';
import { DELETE, DELETE_MANY, UPDATE, UPDATE_MANY } from 'react-admin';
import prismaBuildQuery from './buildQuery';
import introspectionOptions from './introspectionOptions';

export const buildQuery = prismaBuildQuery;

const defaultOptions = {
  buildQuery,
  introspection: introspectionOptions,
};

//TODO: Prisma supports batching (UPDATE_MANY, DELETE_MANY)
export default (options: {
  client?: ApolloClient<any>;
  clientOptions?: ApolloClientOptions<any>;
}) => {
  return buildDataProvider(merge({}, defaultOptions, options)).then(
    graphQLDataProvider => {
      return (
        fetchType: string,
        resource: string,
        params: { [key: string]: any }
      ): Promise<any> => {
        // Temporary work-around until we make use of updateMany and deleteMany mutations
        if (fetchType === DELETE_MANY) {
          const { ids, ...otherParams } = params;
          return Promise.all(
            params.ids.map((id: string) =>
              graphQLDataProvider(DELETE, resource, {
                id,
                ...otherParams,
              })
            )
          ).then(results => {
            return { data: results.map(({ data }: any) => data.id) };
          });
        }

        if (fetchType === UPDATE_MANY) {
          const { ids, ...otherParams } = params;
          return Promise.all(
            params.ids.map((id: string) =>
              graphQLDataProvider(UPDATE, resource, {
                id,
                ...otherParams,
              })
            )
          ).then(results => {
            return { data: results.map(({ data }: any) => data.id) };
          });
        }
        return graphQLDataProvider(fetchType, resource, params);
      };
    }
  );
};
