import { GraphQLInputField } from 'graphql';

export type mmTransformType = (input: {
  [fieldName: string]: any;
}) => { [fieldName: string]: any };

export type mmGraphQLInputField = GraphQLInputField & {
  mmTransform: mmTransformType;
};
