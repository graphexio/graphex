import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLInputType,
  isCompositeType,
  ASTNode,
} from 'graphql';
import { IAMQuerySelector, AMVisitorStack } from '../../types';
import { AMWhereTypeFactory } from '../where';
import { AMQuerySelectorFieldFactory } from './fieldFactory';
import { AMQuerySelectorComplexFieldFactory } from './complexFieldFactory';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import R from 'ramda';
import { AMSelectorContext } from '../../execution/contexts/selector';
import { AMTransaction } from '../../execution/transaction';

export const AsIsSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return !typeWrap.isMany();
  },
  getFieldFactory() {
    return new AMQuerySelectorComplexFieldFactory(
      field => `${field.name}`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);
        let type: GraphQLInputType;
        if (!isCompositeType(namedType)) {
          return namedType;
        } else {
          return schemaInfo.resolveFactoryType(namedType, AMWhereTypeFactory);
          // return this._getInputType(
          //   realType,
          //   isInterface ? INPUT_TYPE_KIND.WHERE_INTERFACE : INPUT_TYPE_KIND.WHERE
          // );
        }
      },
      (node: ASTNode, transaction: AMTransaction, stack: AMVisitorStack) => {
        const action = stack.pop() as AMObjectFieldContext;
        const lastInStack = R.last(stack);

        if (
          lastInStack instanceof AMSelectorContext ||
          lastInStack instanceof AMObjectFieldContext
        ) {
          //transform nested objects to mongodb dot notation
          if (action.value instanceof Object) {
            Object.entries(action.value).forEach(([key, value]) => {
              lastInStack.addValue(`${action.fieldName}.${key}`, value);
            });
          } else {
            lastInStack.addValue(action.fieldName, action.value);
          }
        }
      }
    );
  },
};

// getTransformInput() {
//   const isNested = this._typeWrap.isNested();

//   return reduceTransforms([isNested ? Transforms.flattenNested : null]);
// }
