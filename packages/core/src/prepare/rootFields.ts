import TypeWrap from '@graphex/type-wrap';
import { GraphQLSchema } from 'graphql';
import { AMConfigResolver } from '../config/resolver';
import { AMModelType, AMOptions, GraphQLOperationType } from '../definitions';
import { isAMModelType, appendField } from '../utils';

type rootFieldsParams = {
  schema: GraphQLSchema;
  configResolver: AMConfigResolver;
  options: AMOptions;
};
export const rootFields = ({
  schema,
  configResolver,
  options,
}: rootFieldsParams) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    const typeWrap = new TypeWrap(type);
    if (isAMModelType(type)) {
      if (!typeWrap.isAbstract()) {
        // console.log(`Building queries for ${type.name}`);
        [
          configResolver.resolveMethodFactory(type, 'multipleQuery'),
          configResolver.resolveMethodFactory(type, 'singleQuery'),
          configResolver.resolveMethodFactory(type, 'connectionQuery'),
          configResolver.resolveMethodFactory(type, 'createMutation'),
          configResolver.resolveMethodFactory(type, 'deleteOneMutation'),
          configResolver.resolveMethodFactory(type, 'deleteManyMutation'),
          configResolver.resolveMethodFactory(type, 'updateMutation'),
        ].forEach(fieldFactory => {
          appendField(
            schema,
            fieldFactory.getOperationType() === GraphQLOperationType.Query
              ? schema.getQueryType()
              : schema.getMutationType(),
            fieldFactory,
            type as AMModelType,
            options
          );
        });
      }
    }
  });
};
