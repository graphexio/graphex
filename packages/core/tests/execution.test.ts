import * as DirectiveImplements from '@apollo-model/directive-implements';
import gql from 'graphql-tag';
import AMM from '../src';
import { applyInputTransform } from '../src/inputTypes/utils';
import { AMVisitor } from '../src/execution/visitor';
import { AMTransaction } from '../src/execution/transaction';

const generateSchema = typeDefs => {
  return new AMM({
    queryExecutor: null,
  }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs, DirectiveImplements.typeDefs],
    schemaDirectives: {
      ...DirectiveImplements.schemaDirectives,
    },
  });
};

const schema = generateSchema(gql`
  type Post @model {
    id: ID @id @unique
    title: String
  }
`);

test('simple case', () => {
  const rq = gql`
    {
      posts {
        id
        title
      }
    }
  `;

  const transaction = new AMTransaction();

  AMVisitor.visit(schema, rq, transaction);
  console.log(JSON.stringify(transaction));
});
