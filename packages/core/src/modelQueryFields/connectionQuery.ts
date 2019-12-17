import { GraphQLInt } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMField, AMModelType, IAMFieldFactory } from '../definitions';
import { AMAggregateOperation } from '../execution/operations/aggregateOperation';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { resolve } from '../resolve';
import { lowercaseFirstLetter } from '../tsutils';
import { AMConnectionTypeFactory } from '../types/connection';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMOperation } from '../execution/operation';
import { skipArg } from '../args/skip';
import { firstArg } from '../args/first';
import { AMSelectorContext } from '../execution/contexts/selector';

export const AMModelConnectionQueryFieldFactory: IAMFieldFactory = {
  getFieldName(modelType: AMModelType): string {
    return R.pipe(pluralize, lowercaseFirstLetter, R.concat)(modelType.name)(
      'Connection'
    );
  },
  getField(modelType: AMModelType, schemaInfo) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: schemaInfo.resolveFactoryType(modelType, AMConnectionTypeFactory),
      args: [
        {
          name: 'where',
          type: schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory),
        },
        // {
        //   name: 'orderBy',
        //   type: schemaInfo.resolveFactoryType(modelType, AMOrderByTypeFactory),
        // },
        skipArg,
        firstArg,
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMAggregateOperation(transaction, {
          many: false,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMAggregateOperation;
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
