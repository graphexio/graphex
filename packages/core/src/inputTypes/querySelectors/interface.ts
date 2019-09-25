import { GraphQLOutputType, GraphQLInputType, GraphQLField } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';

export interface QuerySelector {
  applicableForType(type: GraphQLOutputType): boolean;
  inputType(
    type: GraphQLOutputType,
    options: {
      getInputType: (
        type: GraphQLOutputType,
        kind: INPUT_TYPE_KIND
      ) => GraphQLInputType;
    }
  ): GraphQLInputType;
  inputFieldName(fieldName: String): string;
  transformInput: (
    input: { [fieldName: string]: any },
    options: { field: GraphQLField<any, any, any> }
  ) => { [fieldName: string]: any };
}
