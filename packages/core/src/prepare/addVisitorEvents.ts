import { GraphQLSchema, isObjectType } from 'graphql';
import R from 'ramda';
import { AMField, AMModelField } from '../definitions';
import { AMFieldsSelectionContext } from '../execution/contexts/fieldsSelection';
import { AMOperation } from '../execution/operation';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMSelectorContext } from '../execution/contexts/selector';
import { getLastOperation, getFieldsSelectionPath } from '../execution/utils';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { start } from 'repl';
import { Operation } from 'graphql-tools';
import { AMReadDBRefOperation } from '../execution/operations/readDbRefOperation';

export const addVisitorEvents = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation) {
          field.amEnter = (node, transaction, stack) => {
            const lastStackItem = R.last(stack);
            if (lastStackItem instanceof AMFieldsSelectionContext) {
              if (!field.relation.external) {
                lastStackItem.addField(field.relation.storeField);
              } else {
                lastStackItem.addField(field.relation.relationField);
              }
            }

            const lastOperation = getLastOperation(stack);
            let path = getFieldsSelectionPath(stack, lastOperation);

            if (field.relation.external) {
              const pathArr = path.split('.');
              pathArr.pop();
              pathArr.push(field.name);
              path = pathArr.join('.');
            }

            let relationOperation: AMOperation;

            if (!field.relation.abstract) {
              relationOperation = new AMReadOperation(transaction, {
                many: true,
                collectionName: field.relation.collection,
                selector: new AMSelectorContext(
                  !field.relation.external
                    ? {
                        [field.relation.relationField]: {
                          $in: lastOperation.getResult().distinct(path),
                        },
                      }
                    : {
                        [field.relation.storeField]: {
                          $in: lastOperation
                            .getResult()
                            .distinct(field.relation.relationField),
                        },
                      }
                ),
              });
            } else {
              relationOperation = new AMReadDBRefOperation(transaction, {
                many: true,
                dbRefList: lastOperation.getResult().distinct(path),
              });
            }

            stack.push(relationOperation);

            if (field.relation.abstract) {
              lastOperation.setOutput(
                lastOperation
                  .getOutput()
                  .dbRefReplace(path, () => relationOperation.getOutput())
              );
            } else if (!field.relation.external) {
              lastOperation.setOutput(
                lastOperation
                  .getOutput()
                  .distinctReplace(path, field.relation.relationField, () =>
                    relationOperation.getOutput()
                  )
              );
            } else {
              lastOperation.setOutput(
                lastOperation
                  .getOutput()
                  .lookup(
                    path,
                    field.relation.relationField,
                    field.relation.storeField,
                    () => relationOperation.getOutput()
                  )
              );
            }
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
