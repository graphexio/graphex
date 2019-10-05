import { getNamedType, GraphQLInputType, ObjectFieldNode } from 'graphql';
import R from 'ramda';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMSelectorContext } from '../../execution/contexts/selector';
import {
  AMInputField,
  AMModelField,
  AMSchemaInfo,
  IAMInputFieldFactory,
} from '../../types';

export class AMQuerySelectorFieldFactory implements IAMInputFieldFactory {
  private _getFieldName: (field: AMModelField) => string;
  private _getFieldType: (
    field: AMModelField,
    schemaInfo: AMSchemaInfo
  ) => GraphQLInputType;
  private _transformValue: (input: any) => any;
  private _isApplicable: (field: AMModelField) => boolean;

  constructor(
    isApplicable: (field: AMModelField) => boolean,
    getFieldName: (field: AMModelField) => string,
    getFieldType: (
      field: AMModelField,
      schemaInfo: AMSchemaInfo
    ) => GraphQLInputType,
    transformValue: (input: any) => any
  ) {
    this._isApplicable = isApplicable;
    this._getFieldName = getFieldName;
    this._getFieldType = getFieldType;
    this._transformValue = transformValue;
  }

  isApplicable(field) {
    return this._isApplicable(field);
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
      amEnter(node: ObjectFieldNode, transaction, stack) {
        const context = new AMObjectFieldContext(field.dbName);
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMObjectFieldContext;
        const lastInStack = R.last(stack);
        if (
          lastInStack instanceof AMSelectorContext ||
          lastInStack instanceof AMObjectFieldContext
        ) {
          lastInStack.addValue(
            context.fieldName,
            self._transformValue(context.value)
          );
        }
      },
    };
  }
}
