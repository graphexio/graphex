import { GraphQLSchema, isObjectType } from 'graphql';
import R from 'ramda';
import { AMField, AMModelField } from '../types';
import { AMFieldsSelectionContext } from '../execution/contexts/fieldsSelection';
import { AMOperation } from '../execution/operation';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMSelectorContext } from '../execution/contexts/selector';
import { getLastOperation } from '../execution/utils';

export const addVisitorEvents = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation) {
          field.amEnter = (node, transaction, stack) => {
            const lastStackItem = R.last(stack);
            if (lastStackItem instanceof AMFieldsSelectionContext) {
              lastStackItem.addField(field.relation.storeField);
            }

            const previousOperation = getLastOperation(stack);

            const relationOperation = new AMReadOperation(transaction, {
              collectionName: field.relation.collection,
              selector: new AMSelectorContext({
                [field.relation.relationField]: {
                  $in: previousOperation.getResult().distinct('postId'),
                },
              }),
            });
            stack.push(relationOperation);

            previousOperation.setOutput(
              previousOperation
                .getOutput()
                .distinctReplace('postId', '_id', relationOperation.getOutput())
            );
          };
          field.amLeave = (node, transaction, stack) => {
            const relationOperation = stack.pop();
          };
        } else {
          field.amEnter = (node, transaction, stack) => {
            const lastStackItem = R.last(stack);
            if (lastStackItem instanceof AMFieldsSelectionContext) {
              lastStackItem.addField(field.dbName);
            }
          };
          // field.amLeave=(node, transaction, stack)=>{
          // },
        }
      });
    }
  });
};
