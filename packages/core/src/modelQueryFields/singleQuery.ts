import { GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { lowercaseFirstLetter } from '../tsutils';
import { AMField, AMModelType, IAMFieldFactory } from '../definitions';
import { resolve } from '../resolve';

export const AMModelSingleQueryFieldFactory: IAMFieldFactory = {
  getFieldName(modelType: AMModelType): string {
    return lowercaseFirstLetter(modelType.name);
  },
  getField(modelType: AMModelType, schemaInfo) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: modelType,
      args: [
        {
          name: 'where',
          type: schemaInfo.resolveFactoryType(
            modelType,
            AMWhereUniqueTypeFactory
          ),
        },
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMReadOperation(transaction, {
          many: false,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      amLeave(node, transaction, stack) {
        stack.pop();
      },
      resolve: resolve,
    };
  },
};
