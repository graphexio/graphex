import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLInputType,
  isCompositeType,
  ASTNode,
} from 'graphql';
import {
  IAMQuerySelector,
  AMVisitorStack,
  AMModelType,
} from '../../definitions';
import { AMWhereTypeFactory } from '../where';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';
import { AMQuerySelectorComplexFieldFactory } from '../fieldFactories/querySelectorComplex';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import R from 'ramda';
import { AMSelectorContext } from '../../execution/contexts/selector';
import { AMTransaction } from '../../execution/transaction';

export const AsIsSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return !typeWrap.isMany() && !field.relation;
  },
  getFieldFactory() {
    return new AMQuerySelectorComplexFieldFactory(
      this.isApplicable,
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
      (
        node: ASTNode,
        transaction: AMTransaction,
        stack: AMVisitorStack,
        context: AMObjectFieldContext,
        field,
        schemaInfo
      ) => {
        const lastInStack = R.last(stack);
        if (
          lastInStack instanceof AMSelectorContext ||
          lastInStack instanceof AMObjectFieldContext
        ) {
          //transform nested objects to mongodb dot notation
          const namedType = getNamedType(field.type) as AMModelType;
          if (namedType.mmEmbedded) {
            Object.entries(context.value).forEach(([key, value]) => {
              lastInStack.addValue(`${context.fieldName}.${key}`, value);
            });
          } else {
            lastInStack.addValue(context.fieldName, context.value);
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
