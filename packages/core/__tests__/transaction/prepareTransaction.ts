import { validate } from 'graphql';
import { AMVisitor } from '../../src/execution/visitor';
import { AMTransaction } from '../../src/execution/transaction';

export const prepareTransaction = (schema, rq, variables = {}) => {
  const errors = validate(schema, rq);
  if (errors.length > 0) {
    throw errors;
  }
  const transaction = new AMTransaction();
  AMVisitor.visit(schema, rq, variables, transaction);
  return transaction;
};