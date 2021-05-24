import { DocumentNode, GraphQLResolveInfo } from 'graphql';
import { AMTransaction } from './execution/transaction';
import { AMVisitor } from './execution/visitor';
// import Serializer from './serializer';

export const resolve = (parent, args, context, info: GraphQLResolveInfo) => {
  context.fieldsRegistry = new Map();
  const transaction = new AMTransaction(context.fieldsRegistry);

  const rq: DocumentNode = {
    kind: 'Document',
    definitions: [
      {
        ...info.operation,
        selectionSet: {
          kind: 'SelectionSet',
          selections: info.fieldNodes,
        },
      },
    ],
  };

  AMVisitor.visit(
    info.schema,
    rq,
    info.variableValues,
    transaction,
    info.fragments
  );
  // console.log(Serializer.print(transaction));
  return transaction.execute(context.queryExecutor);
};
