import { GraphQLOutputType, GraphQLInputType, GraphQLField } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import TypeWrap from '@apollo-model/type-wrap';

export default abstract class QuerySelector {
  _field: GraphQLField<any, any, any>;
  _getInputType: (
    type: GraphQLOutputType,
    kind: INPUT_TYPE_KIND
  ) => GraphQLInputType;
  _typeWrap: TypeWrap;
  _selectorName: string;

  constructor(options: {
    field: GraphQLField<any, any, any>;
    getInputType: (
      type: GraphQLOutputType,
      kind: INPUT_TYPE_KIND
    ) => GraphQLInputType;
  }) {
    this._field = options.field;
    this._getInputType = options.getInputType;
    this._typeWrap = new TypeWrap(options.field.type);
  }

  abstract isApplicable(): boolean;
  abstract getInputFieldType(): GraphQLInputType;
  getInputFieldName(): string {
    return `${this._field.name}_${this._selectorName}`;
  }
  getFieldName() {
    return this._field.name;
  }

  abstract getTransformInput(): (input: {
    [fieldName: string]: any;
  }) => { [fieldName: string]: any };
}
