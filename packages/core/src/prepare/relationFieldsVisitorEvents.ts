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
import { AMTransaction } from '../execution/transaction';
import { AMVisitorStack } from '../execution/visitorStack';
import { sameArguments } from './utils';

export const relationFieldsVisitorEvents = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation) {
          field.resolve = (source, args, ctx, info) => {
            /**
             * Results of children operations should be stored
             * in parent operation result
             * under different keys for each alias.
             */
            if (source.fieldName !== info.path.key) {
              if (info.fieldNodes[0].alias) {
                return source[`$${info.path.key}`];
              }
            }
            return source[info.fieldName];
          };

          field.amEnter = (node: FieldNode, transaction, stack) => {
            /**
             * Relations data should be stored in field with name of an alias
             * Add $ prefix to prevent collision with real fields
             */
            changeContextCurrentPath({ node, field, stack });

            pushFieldIntoSelectionContext({ field, stack });

            const rootOperation = transaction.operations[0];
            const rootCondition = stack.condition(rootOperation);

            const parentDataOperation = stack.lastOperation();
            const parentDataDbPath = stack
              .dbPath(parentDataOperation)
              .join('.');

            const childDataPathArr = stack.path(rootOperation);
            const childDataPath = childDataPathArr.join('.');
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
              childDataPathArr,
            });

            /**
             * Create new operation if there is no existing
             */
            if (!relationOperation) {
              // TODO replace with relation kind enum
              const createOperation = field.relation.abstract
                ? createAbstractBelongsToRelationOperation
                : field.relation.external
                ? createHasRelationOperation
                : createBelongsToRelationOperation;

              ({ relationOperation, transformation } = createOperation({
                field,
                transaction,
                parentDataOperation,
                parentDataDbPath,
                childDataPathArr,
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

const changeContextCurrentPath = ({
  node,
  field,
  stack,
}: {
  node: FieldNode;
  field: AMModelField;
  stack: AMVisitorStack;
}) => {
  const pathItem = node.alias //
    ? `$${node.alias.value}`
    : node.name.value;

  const dbPathItem = field.relation.external
    ? field.dbName
    : field.relation.storeField;

  stack.leavePath();
  stack.enterPath(pathItem, dbPathItem);
};

const pushFieldIntoSelectionContext = ({
  field,
  stack,
}: {
  field: AMModelField;
  stack: AMVisitorStack;
}) => {
  const lastStackItem = stack.last();
  if (lastStackItem instanceof AMFieldsSelectionContext) {
    if (!field.relation.external) {
      lastStackItem.addField(field.relation.storeField);
    } else {
      lastStackItem.addField(field.relation.relationField);
    }
  }
};

type CreateRelationOperationParams = {
  field: AMModelField;
  transaction: AMTransaction;

  parentDataOperation: AMOperation;
  parentDataDbPath: string;

  childDataPathArr: string[];
};

const createAbstractBelongsToRelationOperation = ({
  field,
  transaction,
  parentDataOperation,
  parentDataDbPath,
  childDataPathArr,
}: CreateRelationOperationParams) => {
  const relationOperation = new AMReadDBRefOperation(transaction, {
    many: true,
    dbRefList: parentDataOperation
      .getResult()
      .map(new ResultPromiseTransforms.Distinct(parentDataDbPath)),
  });

  const displayField = childDataPathArr.pop();
  const transformation = new ResultPromiseTransforms.DbRefReplace(
    childDataPathArr,
    displayField,
    field.relation.storeField,
    relationOperation
  );

  return { relationOperation, transformation };
};

const createBelongsToRelationOperation = ({
  field,
  transaction,
  parentDataOperation,
  parentDataDbPath,
  childDataPathArr,
}: CreateRelationOperationParams) => {
  const relationOperation = new AMReadOperation(transaction, {
    many: true,
    collectionName: field.relation.collection,
    fieldsSelection: new AMFieldsSelectionContext([
      field.relation.relationField,
    ]),
    selector: new AMSelectorContext({
      [field.relation.relationField]: {
        $in: parentDataOperation
          .getResult()
          .map(new ResultPromiseTransforms.Distinct(parentDataDbPath)),
      },
    }),
  });

  const displayField = childDataPathArr.pop();
  const transformation = new ResultPromiseTransforms.DistinctReplace(
    childDataPathArr,
    displayField,
    field.relation.storeField,
    field.relation.relationField,
    relationOperation
  );

  return { relationOperation, transformation };
};

const createHasRelationOperation = ({
  field,
  transaction,
  parentDataOperation,
  childDataPathArr,
}: CreateRelationOperationParams) => {
  const relationOperation = new AMReadOperation(transaction, {
    many: true,
    collectionName: field.relation.collection,
    fieldsSelection: new AMFieldsSelectionContext([field.relation.storeField]),
    selector: new AMSelectorContext({
      [field.relation.storeField]: {
        $in: parentDataOperation
          .getResult()
          .map(
            new ResultPromiseTransforms.Distinct(field.relation.relationField)
          ),
      },
    }),
  });

  //TODO: Add runtime checking for existing unique index on relation field.
  const transformation = new ResultPromiseTransforms.Lookup(
    childDataPathArr.join('.'),
    field.relation.relationField,
    field.relation.storeField,
    relationOperation,
    isListType(field.type) ||
      (isNonNullType(field.type) && isListType(field.type.ofType))
  );

  return { relationOperation, transformation };
};

const getExistingOperation = ({
  args,
  rootOperation,
  childDataPathArr,
}: {
  args?: FieldNode['arguments'];
  rootOperation: AMOperation;
  childDataPathArr: string[];
}) => {
  const existingTransformations =
    rootOperation.fieldTransformations.get(childDataPathArr.join('.')) || [];

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
