import TypeWrap from '@graphex/type-wrap';
import {
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
  isOutputType,
} from 'graphql';
import { firstArg } from '../args/first';
import { offsetArg } from '../args/offset';
import { AMConfigResolver } from '../config/resolver';
import { AMModelField, AMModelType } from '../definitions';

export const relationsArguments = (
  schema: GraphQLSchema,
  configResolver: AMConfigResolver
) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isOutputType(type) && (isObjectType(type) || isInterfaceType(type))) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation) {
          const typeWrap = new TypeWrap(field.type);
          const realType = typeWrap.realType() as AMModelType;

          field.args = [
            {
              name: 'where',
              description: null,
              extensions: undefined,
              astNode: undefined,
              type: configResolver.resolveInputType(realType, 'where'),
              defaultValue: undefined,
            },
            ...(!realType.mmAbstract
              ? [
                  {
                    name: 'orderBy',
                    description: null,
                    extensions: undefined,
                    astNode: undefined,
                    type: configResolver.resolveInputType(realType, 'orderBy'),
                    defaultValue: undefined,
                  },
                ]
              : []),
            offsetArg,
            firstArg,
          ];
        }
      });
    }
  });
};
