import {
  getNamedType,
  GraphQLList,
  GraphQLNonNull,
  isScalarType,
} from 'graphql';
import R from 'ramda';
import { AMModelType, IAMFieldFactory } from '../../../definitions';
import { AMObjectFieldContext } from '../../../execution/contexts/objectField';
import { AMReadEntitiesOperation } from '../../../execution/operations/readEntitiesOperation';
import { resolve } from '../../../resolve';
import { AMFederationAnyTypeFactory } from './anyType';
import { AMFederationEntityTypeFactory } from './entityType';

export const AMFederationEntitiesFieldFactory: IAMFieldFactory = {
  getFieldName() {
    return '_entities';
  },
  getField(inputType, schemaInfo) {
    return {
      name: this.getFieldName(),
      description: '',
      extensions: undefined,
      isDeprecated: false,
      type: new GraphQLNonNull(
        new GraphQLList(
          schemaInfo.resolveFactoryType(null, AMFederationEntityTypeFactory)
        )
      ),
      args: [
        {
          name: 'representations',
          defaultValue: undefined,
          description: undefined,
          extensions: undefined,
          astNode: undefined,
          type: new GraphQLNonNull(
            new GraphQLList(
              new GraphQLNonNull(
                schemaInfo.resolveFactoryType(null, AMFederationAnyTypeFactory)
              )
            )
          ),
          amEnter(node, transaction, stack) {
            const context = new AMObjectFieldContext();
            stack.push(context);
          },
          amLeave(node, transaction, stack) {
            const context = stack.pop() as AMObjectFieldContext;

            const lastOperation = stack.lastOperation() as AMReadEntitiesOperation;

            const normalizedRepresentations = (context.value as {
              [k: string]: any;
            }[]).map(({ __typename, ...where }) => {
              const type = schemaInfo.schema.getType(__typename) as AMModelType;
              const fields = type.getFields();

              const mapParseScalars = ([fieldName, value]) => {
                const fieldType = getNamedType(fields[fieldName].type);
                if (isScalarType(fieldType)) {
                  return [fieldName, fieldType.parseValue(value)];
                } else {
                  return [fieldName, value];
                }
              };

              const mapFieldName = ([fieldName, value]) => {
                return [fields[fieldName].dbName, value];
              };

              const collectionName = type.mmCollectionName;
              const selector = R.pipe(
                Object.entries,
                R.map(R.pipe(mapParseScalars, mapFieldName)),
                Object.fromEntries
              )(where);

              return { collectionName, selector, typename: __typename };
            });

            lastOperation.setRepresentations(normalizedRepresentations);
          },
        },
      ],
      amEnter(node, transaction, stack) {
        const context = new AMReadEntitiesOperation(transaction, {});
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        stack.pop();
      },
      resolve: resolve,
    };
  },
};
