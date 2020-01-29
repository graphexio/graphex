import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  isInterfaceType,
} from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { AMWhereACLTypeFactory } from '../inputTypes/whereACL';
import { lowercaseFirstLetter } from '../utils';
import {
  AMField,
  AMModelType,
  IAMFieldFactory,
  IAMMethodFieldFactory,
  GraphQLOperationType,
} from '../definitions';
import { resolve } from '../resolve';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMOperation } from '../execution/operation';
import { skipArg } from '../args/skip';
import { firstArg } from '../args/first';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMInterfaceWhereTypeFactory } from '../inputTypes/interfaceWhere';

export const AMModelMultipleQueryFieldFactory: IAMMethodFieldFactory = {
  getOperationType() {
    return GraphQLOperationType.Query;
  },
  getFieldName(modelType: AMModelType): string {
    return R.pipe(pluralize, lowercaseFirstLetter)(modelType.name);
  },
  getField(modelType: AMModelType, schemaInfo) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(modelType))),
      args: [
        {
          name: 'where',
          type: schemaInfo.resolveFactoryType(
            modelType,
            isInterfaceType(modelType)
              ? AMInterfaceWhereTypeFactory
              : AMWhereTypeFactory
          ),
        },
        {
          name: 'orderBy',
          type: schemaInfo.resolveFactoryType(modelType, AMOrderByTypeFactory),
        },
        skipArg,
        firstArg,
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMReadOperation(transaction, {
          many: true,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMReadOperation;
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
