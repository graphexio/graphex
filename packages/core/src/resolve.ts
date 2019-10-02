import { AMVisitor } from './execution/visitor';
import { AMTransaction } from './execution/transaction';
import { DocumentNode, GraphQLResolveInfo } from 'graphql';
import gql from 'graphql-tag';

export const resolve = (parent, args, context, info: GraphQLResolveInfo) => {
  const transaction = new AMTransaction();

  const rq: DocumentNode = {
    kind: 'Document',
    definitions: [
      {
        kind: 'OperationDefinition',
        operation: 'query',
        name: undefined,
        variableDefinitions: [],
        directives: [],
        selectionSet: {
          kind: 'SelectionSet',
          selections: info.fieldNodes,
        },
      },
    ],
  };

  AMVisitor.visit(info.schema, rq, info.variableValues, transaction);
  return transaction.execute(context.queryExecutor);
};
