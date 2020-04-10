import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLSchema, isInterfaceType, isObjectType } from 'graphql';
import { firstArg } from '../args/first';
import { skipArg } from '../args/skip';
import { AMConfigResolver } from '../config/resolver';
import { AMModelField, AMModelType } from '../definitions';
import { AMObjectFieldContext } from '../execution';
import { getFieldPath, getLastOperation } from '../execution/utils';
import { ResultPromiseTransforms } from '../execution/resultPromise';

export const nestedArrays = (
  schema: GraphQLSchema,
  configResolver: AMConfigResolver
) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (type.mmModel || type.mmEmbedded || type.mmModelInherited) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.noArrayFilter) return;
        const typeWrap = new TypeWrap(field.type);
        const realType = typeWrap.realType() as AMModelType;
        if (
          typeWrap.isMany() &&
          !field.relation &&
          (isObjectType(realType) || isInterfaceType(realType))
        ) {
          field.args = [
            {
              name: 'where',
              description: null,
              extensions: undefined,
              astNode: undefined,
              type: configResolver.resolveInputType(realType, 'where'),
              defaultValue: undefined,
              amEnter: (node, transaction, stack) => {
                stack.push(new AMObjectFieldContext());
              },
              amLeave: (node, transaction, stack) => {
                const context = stack.pop() as AMObjectFieldContext;
                const operation = getLastOperation(stack);
                const path = getFieldPath(stack, operation);
                // console.log(path, context.value);
                operation.setOutput(
                  operation.getOutput().map(
                    ResultPromiseTransforms.transformArray(path, {
                      where: context.value as {},
                    })
                  )
                );
                return;
              },
            },

            {
              name: 'orderBy',
              description: null,
              extensions: undefined,
              astNode: undefined,
              type: configResolver.resolveInputType(realType, 'orderBy'),
              defaultValue: undefined,
            },
            skipArg,
            firstArg,
          ];
        }
      });
    }
  });
};
