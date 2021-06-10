import { DBRef } from 'bson';
import {
  FieldNode,
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
} from 'graphql';
import { AMModelField, RelationInfo } from '../../definitions';
import { AMFieldsSelectionContext } from '../../execution/contexts/fieldsSelection';
import { AMSelectorContext } from '../../execution/contexts/selector';
import { AMOperation } from '../../execution/operation';
import { AMAggregateOperation } from '../../execution/operations/aggregateOperation';
import { AMConnectionOperation } from '../../execution/operations/connectionOperation';
import { AMReadDBRefOperation } from '../../execution/operations/readDbRefOperation';
import { AMReadOperation } from '../../execution/operations/readOperation';
import { Path } from '../../execution/path';
import { ResultPromiseTransforms } from '../../execution/resultPromise';
import { Batch } from '../../execution/resultPromise/batch';
import { AMTransaction } from '../../execution/transaction';
import { AMVisitorStack } from '../../execution/visitorStack';
import { sameArguments } from '../../common/utils';

export const relationFieldsVisitorEvents = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation || field.nodesRelation || field.aggregateRelation) {
          field.resolve = async (source, args, ctx, info) => {
            return ctx.fieldsRegistry.get(info.fieldNodes[0])(source);
          };

          field.amEnter = (node: FieldNode, transaction, stack) => {
            const lastOperation = stack.lastOperation();
            const isInConnection =
              lastOperation instanceof AMConnectionOperation;
            const relationInfo = getRelationInfo({
              parentDataOperation: lastOperation,
              field,
            });
            const isRootConnectionQuery = relationInfo.storeField === null;

            pushFieldIntoSelectionContext({ relationInfo, stack });

            const rootOperation = transaction.operations[0];
            const childDataPath = stack.path(rootOperation);

            let { relationOperation, resolve } = getExistingOperation({
              args: node.arguments,
              rootOperation,
              childDataPath,
            });

            /**
             * Create new operation if there is no existing
             */
            if (!relationOperation) {
              // TODO replace with relation kind enum
              let createOperation: ({
                relationInfo,
                transaction,
              }: CreateRelationOperationParams) => {
                relationOperation: AMReadDBRefOperation;
                resolve: (parent: any) => Promise<any>;
              };

              if (relationInfo.abstract) {
                // TODO add missing logic
                createOperation = createAbstractBelongsToRelationOperation;
              } else if (isRootConnectionQuery) {
                createOperation = field.aggregateRelation
                  ? createAggregateOperation
                  : createReadOperation;
              } else if (field.aggregateRelation) {
                createOperation = relationInfo.external
                  ? createHasAggregateRelationOperation
                  : createBelongsAggregateRelationOperation;
              } else {
                createOperation = relationInfo.external
                  ? createHasRelationOperation
                  : createBelongsToRelationOperation;
              }

              ({ relationOperation, resolve } = createOperation({
                relationInfo,
                transaction,
                filter: isInConnection
                  ? lastOperation.selector?.selector
                  : undefined,
                skip: isInConnection ? lastOperation.skip : undefined,
                first: isInConnection ? lastOperation.first : undefined,
              }));

              rootOperation.addRelationOperation(childDataPath, {
                relationOperation,
                resolve,
                args: node.arguments,
              });
            }

            stack.push(relationOperation);

            transaction.fieldsRegistry.set(node, resolve);
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
  filter?: Record<any, any>;
  skip?: number;
  first?: number;
};

const createAbstractBelongsToRelationOperation = ({
  relationInfo,
  transaction,
}: CreateRelationOperationParams) => {
  const batch = new Batch<DBRef>();

  const relationOperation = new AMReadDBRefOperation(transaction, {
    many: true,
    dbRefList: batch,
  });

  const resolve = async parent => {
    const ref = parent[relationInfo.storeField];
    if (Array.isArray(ref)) {
      batch.addIds(ref);
    } else {
      batch.addId(ref);
    }

    const dataMap = await relationOperation.getOutput().getPromise();
    if (Array.isArray(ref)) {
      return ref.map(ref => ({
        ...dataMap[ref.namespace][ref.oid.toHexString()],
        mmCollectionName: ref.namespace,
      }));
    } else {
      return {
        ...dataMap[ref.namespace][ref.oid.toHexString()],
        mmCollectionName: ref.namespace,
      };
    }
  };

  return { relationOperation, resolve };
};

const createBelongsToRelationOperation = ({
  relationInfo,
  transaction,
  filter,
  skip = 0,
  first,
}: CreateRelationOperationParams) => {
  const batch = new Batch();

  const relationOperation = new AMReadOperation(transaction, {
    many: true,
    collectionName: relationInfo.collection,
    fieldsSelection: new AMFieldsSelectionContext([relationInfo.relationField]),
    selector: new AMSelectorContext({
      ...(filter ? { $and: [filter] } : {}),
      [relationInfo.relationField]: {
        $in: batch,
      },
    }),
  });

  relationOperation.addTransformation(
    new ResultPromiseTransforms.IndexBy({
      groupingField: relationInfo.relationField,
    })
  );

  const resolve = async parent => {
    const ids = parent[relationInfo.storeField];
    if (relationInfo.many) {
      batch.addIds(ids);
    } else {
      batch.addId(ids);
    }

    const dataMap = await relationOperation.getOutput().getPromise();
    if (relationInfo.many) {
      const limit = first ? first + skip : ids?.length;
      return (
        ids
          ?.map(id => dataMap[id])
          .filter(Boolean)
          .slice(skip, limit) ?? []
      );
    } else {
      return dataMap[ids];
    }
  };

  return { relationOperation, resolve };
};

const createHasRelationOperation = ({
  relationInfo,
  transaction,
  filter,
  skip = 0,
  first,
}: CreateRelationOperationParams) => {
  const batch = new Batch();

  const relationOperation = new AMReadOperation(transaction, {
    many: true,
    collectionName: relationInfo.collection,
    fieldsSelection: new AMFieldsSelectionContext([relationInfo.storeField]),
    selector: new AMSelectorContext({
      ...(filter ? { $and: [filter] } : {}),
      [relationInfo.storeField]: {
        $in: batch,
      },
    }),
  });

  relationOperation.addTransformation(
    new ResultPromiseTransforms.GroupBy({
      groupingField: relationInfo.storeField,
    })
  );

  const resolve = async parent => {
    const id = parent[relationInfo.relationField];
    batch.addId(id);

    const dataMap = await relationOperation.getOutput().getPromise();
    if (relationInfo.many) {
      const limit = first ? first + skip : dataMap[id]?.length;
      return dataMap[id]?.slice(skip, limit) ?? [];
    } else {
      return dataMap[id]?.[0];
    }
  };

  return { relationOperation, resolve };
};

const createHasAggregateRelationOperation = ({
  relationInfo,
  transaction,
  filter,
}: CreateRelationOperationParams) => {
  const batch = new Batch();

  const relationOperation = new AMAggregateOperation(transaction, {
    many: true,
    collectionName: relationInfo.collection,
    fieldsSelection: new AMFieldsSelectionContext(['totalCount']),
    selector: new AMSelectorContext({
      ...(filter ? { $and: [filter] } : {}),
      [relationInfo.storeField]: {
        $in: batch,
      },
    }),
  });
  relationOperation.groupBy = relationInfo.storeField;

  relationOperation.addTransformation(
    new ResultPromiseTransforms.IndexBy({
      groupingField: relationInfo.storeField,
    })
  );

  const resolve = async parent => {
    const id = parent[relationInfo.relationField];
    batch.addId(id);

    const dataMap = await relationOperation.getOutput().getPromise();
    return dataMap[id].count;
  };

  return { relationOperation, resolve };
};

const createBelongsAggregateRelationOperation = ({
  relationInfo,
  transaction,
  filter,
}: CreateRelationOperationParams) => {
  const batch = new Batch();

  const relationOperation = new AMReadOperation(transaction, {
    many: true,
    collectionName: relationInfo.collection,
    fieldsSelection: new AMFieldsSelectionContext([relationInfo.relationField]),
    selector: new AMSelectorContext({
      ...(filter ? { $and: [filter] } : {}),
      [relationInfo.relationField]: {
        $in: batch,
      },
    }),
  });

  relationOperation.addTransformation(
    new ResultPromiseTransforms.IndexBy({
      groupingField: relationInfo.relationField,
    })
  );

  const resolve = async parent => {
    const ids = parent[relationInfo.storeField];
    if (relationInfo.many) {
      batch.addIds(ids);
    } else {
      throw 'unreachable';
    }

    const dataMap = await relationOperation.getOutput().getPromise();
    if (relationInfo.many) {
      return ids?.filter(id => Boolean(dataMap[id])).length ?? 0;
    } else {
      throw 'unreachable';
    }
  };

  return { relationOperation, resolve };
};

const createReadOperation = ({
  relationInfo,
  transaction,
  filter,
}: CreateRelationOperationParams) => {
  const relationOperation = new AMReadOperation(transaction, {
    many: true,
    collectionName: relationInfo.collection,
    fieldsSelection: new AMFieldsSelectionContext([]),
    selector: new AMSelectorContext({
      ...(filter ? { $and: [filter] } : {}),
    }),
  });

  const resolve = async () => {
    return relationOperation.getOutput().getPromise();
  };

  return { relationOperation, resolve };
};

const createAggregateOperation = ({
  relationInfo,
  transaction,
  filter,
}: CreateRelationOperationParams) => {
  const relationOperation = new AMAggregateOperation(transaction, {
    many: true,
    collectionName: relationInfo.collection,
    fieldsSelection: new AMFieldsSelectionContext([]),
    selector: new AMSelectorContext({
      ...(filter ? { $and: [filter] } : {}),
    }),
  });

  const resolve = async () => {
    return (await relationOperation.getOutput().getPromise())?.[0]?.count ?? 0;
  };

  return { relationOperation, resolve };
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
  const existingOperations =
    rootOperation.relationOperations.get(childDataPath.asString()) || [];

  const fieldArgs = args || [];
  for (const op of existingOperations) {
    if (sameArguments(fieldArgs, op.args)) {
      return op;
    }
  }
  return { relationOperation: undefined, resolve: undefined };
};
