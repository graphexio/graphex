import {
  GraphQLSchema,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
} from 'graphql';
import R from 'ramda';
import { AMModelField } from '../definitions';
import { AMFieldsSelectionContext } from '../execution/contexts/fieldsSelection';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMOperation } from '../execution/operation';
import { AMReadDBRefOperation } from '../execution/operations/readDbRefOperation';
import { AMReadOperation } from '../execution/operations/readOperation';
import { ResultPromiseTransforms } from '../execution/resultPromise';
import { getFieldsSelectionPath, getLastOperation } from '../execution/utils';

export const addVisitorEvents = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type) || isInterfaceType(type)) {
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
                          $in: lastOperation
                            .getResult()
                            .map(new ResultPromiseTransforms.Distinct(path)),
                        },
                      }
                    : {
                        [field.relation.storeField]: {
                          $in: lastOperation
                            .getResult()
                            .map(
                              new ResultPromiseTransforms.Distinct(
                                field.relation.relationField
                              )
                            ),
                        },
                      }
                ),
              });
            } else {
              relationOperation = new AMReadDBRefOperation(transaction, {
                many: true,
                dbRefList: lastOperation
                  .getResult()
                  .map(new ResultPromiseTransforms.Distinct(path)),
              });
            }

            stack.push(relationOperation);

            if (field.relation.abstract) {
              lastOperation.setOutput(
                lastOperation
                  .getOutput()
                  .map(
                    new ResultPromiseTransforms.DbRefReplace(
                      path,
                      relationOperation.getOutput()
                    )
                  )
              );
            } else if (!field.relation.external) {
              lastOperation.setOutput(
                lastOperation
                  .getOutput()
                  .map(
                    new ResultPromiseTransforms.DistinctReplace(
                      path,
                      field.relation.relationField,
                      relationOperation.getOutput()
                    )
                  )
              );
            } else {
              lastOperation.setOutput(
                lastOperation.getOutput().map(
                  new ResultPromiseTransforms.Lookup(
                    path,
                    field.relation.relationField,
                    field.relation.storeField,
                    relationOperation.getOutput(),
                    isListType(field.type) ||
                      (isNonNullType(field.type) &&
                        isListType(field.type.ofType)) //TODO: Add runtime checking for existing unique index on relation field.
                  )
                )
              );
            }
          };
          field.amLeave = (node, transaction, stack) => {
            stack.pop();
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
