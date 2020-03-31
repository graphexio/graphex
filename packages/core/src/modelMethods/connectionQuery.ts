import pluralize from 'pluralize';
import R from 'ramda';
import { firstArg } from '../args/first';
import { skipArg } from '../args/skip';
import {
  AMField,
  AMModelType,
  GraphQLOperationType,
  IAMMethodFieldFactory,
  AMMethodFieldFactory,
} from '../definitions';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMAggregateOperation } from '../execution/operations/aggregateOperation';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { AMWhereACLTypeFactory } from '../inputTypes/whereACL';
import { resolve } from '../resolve';
import { lowercaseFirstLetter } from '../utils';
import { AMConnectionTypeFactory } from '../types/connection';
import { isInterfaceType } from 'graphql';
import { AMInterfaceWhereTypeFactory } from '../inputTypes/interfaceWhere';

export class AMModelConnectionQueryFieldFactory extends AMMethodFieldFactory {
  getOperationType() {
    return GraphQLOperationType.Query;
  }
  getFieldName(modelType: AMModelType): string {
    return R.pipe(pluralize, lowercaseFirstLetter, R.concat)(modelType.name)(
      'Connection'
    );
  }
  getField(modelType: AMModelType) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: this.schemaInfo.resolveFactoryType(
        modelType,
        AMConnectionTypeFactory
      ),
      args: [
        {
          name: 'where',
          type: this.configResolver.resolveInputType(
            modelType,
            this.links.where
          ),
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
  }
}
