import {
  getNamedType,
  GraphQLInputType,
  isCompositeType,
  ObjectFieldNode,
  ASTNode,
} from 'graphql';
import R from 'ramda';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMSelectorContext } from '../../execution/contexts/selector';
import {
  IAMInputFieldFactory,
  AMModelField,
  AMSchemaInfo,
  AMInputField,
  AMVisitorStack,
} from '../../types';
import { AMWhereTypeFactory } from '../where';
import { AMTransaction } from '../../execution/transaction';

export class AMQuerySelectorComplexFieldFactory
  implements IAMInputFieldFactory {
  private _getFieldName: (field: AMModelField) => string;
  private _getFieldType: (
    field: AMModelField,
    schemaInfo: AMSchemaInfo
  ) => GraphQLInputType;
  private _applyValue: (
    node: ASTNode,
    transaction: AMTransaction,
    stack: AMVisitorStack
  ) => void;

  constructor(
    getFieldName: (field: AMModelField) => string,
    getFieldType: (
      field: AMModelField,
      schemaInfo: AMSchemaInfo
    ) => GraphQLInputType,
    applyValue: (
      node: ASTNode,
      transaction: AMTransaction,
      stack: AMVisitorStack
    ) => void
  ) {
    this._getFieldName = getFieldName;
    this._getFieldType = getFieldType;
    this._applyValue = applyValue;
  }

  getFieldName(field) {
    return this._getFieldName(field);
  }
  getField(field, schemaInfo) {
    const self = this;
    const namedType = getNamedType(field.type);
    let type = this._getFieldType(field, schemaInfo);

    return <AMInputField>{
      name: this.getFieldName(field),
      type,
      mmTransform: params => params,
      amEnter(node: ObjectFieldNode, transaction, stack) {
        const action = new AMObjectFieldContext(field.dbName);
        stack.push(action);
      },
      amLeave(node, transaction, stack) {
        self._applyValue(node, transaction, stack);
      },
    };
  }
}
