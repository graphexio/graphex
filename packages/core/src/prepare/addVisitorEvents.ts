import {
  FieldNode,
  GraphQLSchema,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
} from 'graphql';
import { AMModelField } from '../definitions';
import { AMFieldsSelectionContext } from '../execution/contexts/fieldsSelection';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMOperation } from '../execution/operation';
import { AMReadDBRefOperation } from '../execution/operations/readDbRefOperation';
import { AMReadOperation } from '../execution/operations/readOperation';
import { ResultPromiseTransforms } from '../execution/resultPromise';
import { RelationTransformation } from '../execution/resultPromise/relationTransformation';
import { sameArguments } from './utils';

export const addVisitorEvents = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation) {
          field.amEnter = (node: FieldNode, transaction, stack) => {
            /**
             * Relations data should be stored in field with name of alias
             * Add $ prefix to prevent collision with real fields
             */
            let pathItem: string;
            if (node.alias) {
              pathItem = `$${node.alias.value}`;
            } else {
              pathItem = node.name.value;
            }
            let dbPathItem: string;
            if (field.relation.external) {
              dbPathItem = field.dbName;
            } else {
              dbPathItem = field.relation.storeField;
            }

            stack.leavePath();
            stack.enterPath(pathItem, dbPathItem);

            const lastStackItem = stack.last();
            if (lastStackItem instanceof AMFieldsSelectionContext) {
              if (!field.relation.external) {
                lastStackItem.addField(field.relation.storeField);
              } else {
                lastStackItem.addField(field.relation.relationField);
              }
            }

            const rootOperation = transaction.operations[0];
            const rootCondition = stack.condition(rootOperation);

            const rootPathArr = stack.path(rootOperation);
            const rootPath = rootPathArr.join('.');

            const lastOperation = stack.lastOperation();
            const dbPathArr = stack.dbPath(lastOperation);
            const dbPath = dbPathArr.join('.');

            //look for existing transformation for the field with the same args
            const existingTransformations =
              rootOperation.fieldTransformations.get(rootPath) || [];

            const fieldArgs = node.arguments || [];
            for (const transformation of existingTransformations) {
              if (transformation instanceof RelationTransformation) {
                const transformationArgs =
                  transformation.getFieldNodes()?.[0]?.arguments || [];
                if (sameArguments(fieldArgs, transformationArgs)) {
                  transformation.addCondition(rootCondition);
                  transformation.addFieldNode(node);
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
                            .map(new ResultPromiseTransforms.Distinct(dbPath)),
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
                  .map(new ResultPromiseTransforms.Distinct(dbPath)),
              });
            }

            stack.push(relationOperation);

            let transformation: RelationTransformation;
            if (field.relation.abstract) {
              const displayField = rootPathArr.pop();
              transformation = new ResultPromiseTransforms.DbRefReplace(
                rootPathArr,
                displayField,
                field.relation.storeField,
                relationOperation
              );
            } else if (!field.relation.external) {
              const displayField = rootPathArr.pop();
              transformation = new ResultPromiseTransforms.DistinctReplace(
                rootPathArr,
                displayField,
                field.relation.storeField,
                field.relation.relationField,
                relationOperation
              );
            } else {
              //TODO: Add runtime checking for existing unique index on relation field.
              transformation = new ResultPromiseTransforms.Lookup(
                rootPath,
                field.relation.relationField,
                field.relation.storeField,
                relationOperation,
                isListType(field.type) ||
                  (isNonNullType(field.type) && isListType(field.type.ofType))
              );
            }
            transformation.addCondition(rootCondition);
            transformation.addFieldNode(node);
            rootOperation.addFieldTransformation(rootPath, transformation);
          };
          field.amLeave = (node, transaction, stack) => {
            stack.pop();
          };
        } else {
          field.amEnter = (node, transaction, stack) => {
            const lastStackItem = stack.last();
            if (lastStackItem instanceof AMFieldsSelectionContext) {
              lastStackItem.addField(field.dbName);
            }
          };
        }
      });
    }
  });
};
