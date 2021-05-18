import {
  FieldNode,
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
} from 'graphql';
import { AMModelField, RelationInfo } from '../definitions';
import { AMFieldsSelectionContext } from '../execution/contexts/fieldsSelection';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMOperation } from '../execution/operation';
import { AMAggregateOperation } from '../execution/operations/aggregateOperation';
import { AMConnectionOperation } from '../execution/operations/connectionOperation';
import { AMReadDBRefOperation } from '../execution/operations/readDbRefOperation';
import { AMReadOperation } from '../execution/operations/readOperation';
import { Path } from '../execution/path';
import { ResultPromiseTransforms } from '../execution/resultPromise';
import { RelationTransformation } from '../execution/resultPromise/relationTransformation';
import { AMTransaction } from '../execution/transaction';
import { AMVisitorStack } from '../execution/visitorStack';
import { sameArguments } from './utils';

export const relationFieldsVisitorEvents = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation || field.nodesRelation || field.aggregateRelation) {
          field.resolve = (source, args, ctx, info) => {
            const value =
              source[
                getChildDataStoreField(info.fieldNodes[0]) //
              ];
            // TODO: remove this amMapValue hack. Only used in Connection type
            if (field.amMapValue) {
              return field.amMapValue(value);
            } else {
              return value;
            }
          };

          field.amEnter = (node: FieldNode, transaction, stack) => {
            const lastOperation = stack.lastOperation();
            const isInConnection =
              lastOperation instanceof AMConnectionOperation;
            const relationInfo = getRelationInfo({
              parentDataOperation: lastOperation,
              field,
            });

            // parent operation for relation inside connection is the previous one
            const parentDataOperation = isInConnection
              ? stack.lastOperation(1) // take previous operation
              : lastOperation;

            /**
             * Relations data should be stored in field with name of an alias
             * Add $ prefix to prevent collision with real fields
             */
            changeContextCurrentPath({ node, relationInfo, stack });
            pushFieldIntoSelectionContext({ relationInfo, stack });

            const rootOperation = transaction.operations[0];
            const rootCondition = stack.condition(rootOperation);

            const parentDataDbPath = stack.dbPath(parentDataOperation);

            const childDataPath = stack.path(rootOperation);

            const mapItemsPath = childDataPath.clone();
            const displayFieldPath = Path.fromArray(
              [
                mapItemsPath.pop(),
                ...(isInConnection ? [mapItemsPath.pop()] : []), // for connections move one more item from map path into display path
              ].reverse()
            );
            /**
             * When using fragments there is a chance that the same field
             * will be requested multiple times from different fragments but with
             * the same arguments. In this case we can reuse one operation for both
             * fields. All transformations are stored in a hashmap
             * in root operation. Keys are paths to the fields.
             */
            let { relationOperation, transformation } = getExistingOperation({
              args: node.arguments,
              rootOperation,
              childDataPath,
            });

            /**
             * Create new operation if there is no existing
             */
            if (!relationOperation) {
              // TODO replace with relation kind enum
              const createOperation = !field.aggregateRelation
                ? relationInfo.abstract
                  ? createAbstractBelongsToRelationOperation
                  : relationInfo.external
                  ? createHasRelationOperation
                  : createBelongsToRelationOperation
                : createHasAggregateRelationOperation;

              ({ relationOperation, transformation } = createOperation({
                relationInfo,
                transaction,
                parentDataOperation,
                parentDataDbPath,
                mapItemsPath,
                displayFieldPath,
              }));
              rootOperation.addFieldTransformation(
                childDataPath,
                transformation
              );
            }

            stack.push(relationOperation);
            transformation.addCondition(rootCondition);
            transformation.addFieldNode(node);
          };
          field.amLeave = (node, transaction, stack) => {
            stack.pop();
          };
        }
      });
    }
  });
};

const getRelationInfo = ({
  parentDataOperation,
  field,
}: {
  parentDataOperation: AMOperation;
  field: AMModelField;
}) => {
  if (parentDataOperation instanceof AMConnectionOperation) {
    return parentDataOperation.relationInfo;
  }
  return field.relation;
};

const getChildDataStoreField = (node: FieldNode) => {
  /**
   * Results of children operations should be stored
   * in parent operation result
   * under different keys for each alias.
   */
  return node.alias //
    ? `$${node.alias.value}`
    : node.name.value;
};

const changeContextCurrentPath = ({
  node,
  relationInfo,
  stack,
}: {
  node: FieldNode;
  relationInfo: RelationInfo;
  stack: AMVisitorStack;
}) => {
  const pathItem = getChildDataStoreField(node);
  const dbPathItem = relationInfo.external
    ? undefined
    : relationInfo.storeField;

  stack.leavePath();
  stack.enterPath(pathItem, dbPathItem);
};

const pushFieldIntoSelectionContext = ({
  relationInfo,
  stack,
}: {
  relationInfo: RelationInfo;
  stack: AMVisitorStack;
}) => {
  /**
   * For connections put required fields into parent context
   */
  let context = stack.last();
  const lastOperation = stack.lastOperation();
  if (lastOperation instanceof AMConnectionOperation) {
    const idx = stack.rightIndexOf(lastOperation);
    context = stack.last(idx + 1);
  }
  /**
   * -----
   */

  if (context instanceof AMFieldsSelectionContext) {
    if (!relationInfo.external) {
      context.addField(relationInfo.storeField);
    } else {
      context.addField(relationInfo.relationField);
    }
  }
};

type CreateRelationOperationParams = {
  relationInfo: RelationInfo;
  transaction: AMTransaction;

  parentDataOperation: AMOperation;
  parentDataDbPath: Path;
  mapItemsPath: Path;
  displayFieldPath: Path;
};

const createAbstractBelongsToRelationOperation = ({
  relationInfo,
  transaction,
  parentDataOperation,
  parentDataDbPath,
  mapItemsPath,
  displayFieldPath,
}: CreateRelationOperationParams) => {
  const relationOperation = new AMReadDBRefOperation(transaction, {
    many: true,
    dbRefList: parentDataOperation
      .getResult()
      .map(new ResultPromiseTransforms.Distinct(parentDataDbPath.asString())),
  });

  const transformation = new ResultPromiseTransforms.DbRefReplace(
    mapItemsPath.asArray(),
    displayFieldPath.asString(),
    relationInfo.storeField,
    relationOperation
  );

  return { relationOperation, transformation };
};

const createBelongsToRelationOperation = ({
  relationInfo,
  transaction,
  parentDataOperation,
  parentDataDbPath,
  mapItemsPath,
  displayFieldPath,
}: CreateRelationOperationParams) => {
  const relationOperation = new AMReadOperation(transaction, {
    many: true,
    collectionName: relationInfo.collection,
    fieldsSelection: new AMFieldsSelectionContext([relationInfo.relationField]),
    selector: new AMSelectorContext({
      [relationInfo.relationField]: {
        $in: parentDataOperation
          .getResult()
          .map(
            new ResultPromiseTransforms.Distinct(parentDataDbPath.asString())
          ),
      },
    }),
  });

  const transformation = new ResultPromiseTransforms.DistinctReplace(
    mapItemsPath,
    displayFieldPath,
    relationInfo.storeField,
    relationInfo.relationField,
    relationOperation
  );

  return { relationOperation, transformation };
};

const createHasRelationOperation = ({
  relationInfo,
  transaction,
  parentDataOperation,
  mapItemsPath,
  displayFieldPath,
}: CreateRelationOperationParams) => {
  const relationOperation = new AMReadOperation(transaction, {
    many: true,
    collectionName: relationInfo.collection,
    fieldsSelection: new AMFieldsSelectionContext([relationInfo.storeField]),
    selector: new AMSelectorContext({
      [relationInfo.storeField]: {
        $in: parentDataOperation
          .getResult()
          .map(
            new ResultPromiseTransforms.Distinct(relationInfo.relationField)
          ),
      },
    }),
  });

  //TODO: Add runtime checking for existing unique index on relation field.
  const transformation = new ResultPromiseTransforms.Lookup(
    mapItemsPath,
    displayFieldPath,
    relationInfo.relationField,
    relationInfo.storeField,
    relationOperation,
    relationInfo.many
  );

  return { relationOperation, transformation };
};

const createHasAggregateRelationOperation = ({
  relationInfo,
  transaction,
  parentDataOperation,
  mapItemsPath,
  displayFieldPath,
}: CreateRelationOperationParams) => {
  const relationOperation = new AMAggregateOperation(transaction, {
    many: true,
    collectionName: relationInfo.collection,
    fieldsSelection: new AMFieldsSelectionContext(['totalCount']),
    selector: new AMSelectorContext({
      [relationInfo.storeField]: {
        $in: parentDataOperation
          .getResult()
          .map(
            new ResultPromiseTransforms.Distinct(relationInfo.relationField)
          ),
      },
    }),
  });
  relationOperation.groupBy = relationInfo.storeField;

  //TODO: Add runtime checking for existing unique index on relation field.
  const transformation = new ResultPromiseTransforms.Lookup(
    mapItemsPath,
    displayFieldPath,
    relationInfo.relationField,
    relationInfo.storeField,
    relationOperation,
    false
  );

  return { relationOperation, transformation };
};

const getExistingOperation = ({
  args,
  rootOperation,
  childDataPath,
}: {
  args?: FieldNode['arguments'];
  rootOperation: AMOperation;
  childDataPath: Path;
}) => {
  const existingTransformations =
    rootOperation.fieldTransformations.get(childDataPath.asString()) || [];

  const fieldArgs = args || [];
  for (const transformation of existingTransformations) {
    if (transformation instanceof RelationTransformation) {
      const transformationArgs =
        transformation.getFieldNodes()?.[0]?.arguments || [];
      if (sameArguments(fieldArgs, transformationArgs)) {
        return { relationOperation: transformation.dataOp, transformation };
      }
    }
  }
  return { relationOperation: undefined, transformation: undefined };
};
