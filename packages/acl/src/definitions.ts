import { GraphQLSchema, GraphQLNamedType, GraphQLField } from 'graphql';

type ACLRuleInputParams = {
  type: GraphQLNamedType;
  field: GraphQLField<any, any, any>;
};

export type ACLRuleCondition = (params: ACLRuleInputParams) => boolean;
export type ACLRule = (schema: GraphQLSchema) => ACLRuleCondition;

export type ACLDefault = (
  schema: GraphQLSchema
) => {
  cond: ACLRuleCondition;
  fn: () => any;
};
