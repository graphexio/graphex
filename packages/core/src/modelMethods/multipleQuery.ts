import { GraphQLList, GraphQLNonNull } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { firstArg } from '../args/first';
import { offsetArg } from '../args/offset';
import {
  AMField,
  AMMethodFieldFactory,
  AMModelType,
  GraphQLOperationType,
} from '../definitions';
import { AMReadOperation } from '../execution/operations/readOperation';
import { resolve } from '../resolve';
import { lowercaseFirstLetter } from '../utils';
import { attachDiscriminatorToOperationHandler } from '../visitorHandlers/attachDiscriminatorToOperationHandler';

export class AMModelMultipleQueryFieldFactory extends AMMethodFieldFactory {
  getOperationType() {
    return GraphQLOperationType.Query;
  }
  getFieldName(modelType: AMModelType): string {
    return R.pipe(pluralize, lowercaseFirstLetter)(modelType.name);
  }
  getField(modelType: AMModelType) {
    return {
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(modelType))),
      args: [
        {
          name: 'where',
          type: this.configResolver.resolveInputType(
            modelType,
            this.links.where
          ),
          // isInterfaceType(modelType)
          //   ? AMInterfaceWhereTypeFactory
          //   : AMWhereTypeFactory
        },
        {
          name: 'orderBy',
          type: this.configResolver.resolveInputType(
            modelType,
            this.links.orderBy
          ),
        },
        offsetArg,
        firstArg,
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMReadOperation(transaction, {
          many: true,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      ...attachDiscriminatorToOperationHandler(modelType),
      resolve: resolve,
    } as AMField;
  }
}
