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
import {
  getFieldsSelectionPathWithConditions,
  getLastOperation,
} from '../execution/utils';

type Condition = Map<string, string>;
function findConditionsIntersection(cond1: Condition, cond2: Condition) {
  const result: Condition = new Map<string, string>();
  let smallCond: Condition, bigCond: Condition;
  if (cond1.size < cond2.size) {
    smallCond = cond1;
    bigCond = cond2;
  } else {
    smallCond = cond2;
    bigCond = cond1;
  }
  for (const [k, v] of smallCond.entries()) {
    if (bigCond.has(k)) {
      if (bigCond.get(k) !== v) {
        return null;
      } else {
        result.set(k, v);
      }
    }
  }
  return result;
}

export const addVisitorEvents = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation) {
          field.amEnter = (node, transaction, stack, PathInfo) => {
            const lastStackItem = R.last(stack);
            if (lastStackItem instanceof AMFieldsSelectionContext) {
              if (!field.relation.external) {
                lastStackItem.addField(field.relation.storeField);
              } else {
                lastStackItem.addField(field.relation.relationField);
              }
            }

            const rootOperation = transaction.operations[0];
            const rootPathInfo = getFieldsSelectionPathWithConditions(
              stack,
              rootOperation
            );
            const { conditions: rootConditions } = rootPathInfo;

            const rootPathArr = [...PathInfo.path(rootOperation)];
            const rootPath = rootPathArr.join('.');

            const lastOperation = getLastOperation(stack);
            const pathArr = [...PathInfo.db(lastOperation)];
            if (!field.relation.external) {
              pathArr.pop();
              pathArr.push(field.relation.storeField);
            }
            const path = pathArr.join('.');

            const existingTransformations = rootOperation.fieldTransformations.get(
              rootPath
            );
            if (existingTransformations?.length > 0) {
              for (const transformation of existingTransformations) {
                if (
                  transformation instanceof ResultPromiseTransforms.Lookup ||
                  transformation instanceof
                    ResultPromiseTransforms.DistinctReplace ||
                  transformation instanceof ResultPromiseTransforms.DbRefReplace
                ) {
                  if (transformation.conditions) {
                    if (!rootConditions) {
                      //set transformation conditions to intersection
                      transformation.conditions = undefined;
                    } else {
                      const conditionIntersection = findConditionsIntersection(
                        rootConditions,
                        transformation.conditions
                      );
                      if (conditionIntersection) {
                        //set transformation conditions to intersection
                        transformation.conditions = conditionIntersection;
                      } else {
                        continue;
                      }
                    }
                  }

                  stack.push(transformation.dataOp);
                  return;
                }
              }
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
              const displayField = rootPathArr.pop();

              rootOperation.addFieldTransformation(
                rootPath,
                new ResultPromiseTransforms.DbRefReplace(
                  rootPathArr,
                  displayField,
                  field.relation.storeField,
                  relationOperation,
                  rootConditions
                )
              );
            } else if (!field.relation.external) {
              const displayField = rootPathArr.pop();
              rootOperation.addFieldTransformation(
                rootPath,
                new ResultPromiseTransforms.DistinctReplace(
                  rootPathArr,
                  displayField,
                  field.relation.storeField,
                  field.relation.relationField,
                  relationOperation,
                  rootConditions
                )
              );
            } else {
              rootOperation.addFieldTransformation(
                rootPath,
                new ResultPromiseTransforms.Lookup(
                  rootPath,
                  field.relation.relationField,
                  field.relation.storeField,
                  relationOperation,
                  isListType(field.type) ||
                    (isNonNullType(field.type) &&
                      isListType(field.type.ofType)), //TODO: Add runtime checking for existing unique index on relation field.
                  rootConditions
                )
              );
            }
          };
          field.amLeave = (node, transaction, stack) => {
            const relationOperation = stack.pop();
            // const lastOperation = getLastOperation(stack);
            // console.log(lastOperation);
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
