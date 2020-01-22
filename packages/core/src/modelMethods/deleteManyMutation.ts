import { GraphQLNonNull, GraphQLInt } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMDeleteOperation } from '../execution/operations/deleteOperation';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { resolve } from '../resolve';
import {
  AMField,
  AMModelType,
  IAMFieldFactory,
  GraphQLOperationType,
  IAMMethodFieldFactory,
} from '../definitions';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { AMWhereACLTypeFactory } from '../inputTypes/whereACL';
import { AMSelectorContext } from '../execution/contexts/selector';

export const AMModelDeleteManyMutationFieldFactory: IAMMethodFieldFactory = {
  getOperationType() {
    return GraphQLOperationType.Mutation;
  },
  getFieldName(modelType: AMModelType): string {
    return R.pipe(pluralize, R.concat('delete'))(modelType.name);
  },
  getField(modelType: AMModelType, schemaInfo) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: new GraphQLNonNull(GraphQLInt),
      args: [
        {
          name: 'where',
          type: new GraphQLNonNull(
            schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory)
          ),
        },
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMDeleteOperation(transaction, {
          many: true,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMDeleteOperation;
        if (modelType.mmDiscriminatorField && modelType.mmDiscriminator) {
          if (!context.selector) {
            context.setSelector(new AMSelectorContext());
          }

          context.selector.addValue(
            modelType.mmDiscriminatorField,
            modelType.mmDiscriminator
          );
        }
      },
      resolve: resolve,
    };
  },
};
