import { GraphQLInputObjectType, GraphQLList } from 'graphql';
import { toArray } from 'lodash';
import { AMInputObjectType, AMModelType, AMTypeFactory } from '../definitions';
import { AMDataContext } from '../execution';
import { defaultObjectFieldVisitorHandler } from './visitorHandlers';

export class AMCreateManyRelationOutsideTypeFactory extends AMTypeFactory<GraphQLInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateManyRelationOutsideInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => ({
        connect: {
          type: new GraphQLList(
            this.configResolver.resolveInputType(modelType, [
              'whereUniqueExternal',
              'interfaceWhereUniqueExternal',
            ])
          ),
          ...defaultObjectFieldVisitorHandler('connect'),
        },
      }),
      amEnter(node, transaction, stack) {
        const context = new AMDataContext();
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const operation = stack.lastOperation();
        const path = stack.dbPath(operation).asString();
        const context = stack.pop() as AMDataContext;

        const data = stack.getOperationData(operation);

        if (context.data.connect) {
          data.addValue(
            path,
            toArray(context.data.connect).map(
              item => item[modelType?.mmUniqueFields?.[0]?.name]
            )
          );
        }
      },
    });
  }
}
