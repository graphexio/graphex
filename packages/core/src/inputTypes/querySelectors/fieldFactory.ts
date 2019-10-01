import {
  getNamedType,
  GraphQLInputType,
  isCompositeType,
  ObjectFieldNode,
} from 'graphql';
import R from 'ramda';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMSelectorContext } from '../../execution/contexts/selector';
import {
  IAMInputFieldFactory,
  AMModelField,
  AMSchemaInfo,
  AMInputField,
} from '../../types';
import { AMWhereTypeFactory } from '../where';

export class AMQuerySelectorFieldFactory implements IAMInputFieldFactory {
  private _getFieldName: (field: AMModelField) => string;
  private _getFieldType: (
    field: AMModelField,
    schemaInfo: AMSchemaInfo
  ) => GraphQLInputType;
  private _transformValue: (input: any) => any;

  constructor(
    getFieldName: (field: AMModelField) => string,
    getFieldType: (
      field: AMModelField,
      schemaInfo: AMSchemaInfo
    ) => GraphQLInputType,
    transformValue: (input: any) => any
  ) {
    this._getFieldName = getFieldName;
    this._getFieldType = getFieldType;
    this._transformValue = transformValue;
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
        const action = stack.pop() as AMObjectFieldContext;
        const lastInStack = R.last(stack);
        if (
          lastInStack instanceof AMSelectorContext ||
          lastInStack instanceof AMObjectFieldContext
        ) {
          lastInStack.addValue(
            action.fieldName,
            self._transformValue(action.value)
          );
        }
      },
    };
  }
}
