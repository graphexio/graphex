import {
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  isInterfaceType,
} from 'graphql';
import {
  AMInputFieldConfig,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';
import { AMSelectorContext } from '../execution';
import { whereTypeVisitorHandler } from './visitorHandlers';

export class AMInterfaceWhereUniqueExternalTypeFactory extends AMTypeFactory<GraphQLInputObjectType> {
  isApplicable(type: AMModelType) {
    return isInterfaceType(type);
  }
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}InterfaceWhereUniqueExternalInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};

        if (modelType instanceof GraphQLInterfaceType) {
          [
            modelType,
            ...(this.schemaInfo.schema.getPossibleTypes(
              modelType
            ) as AMModelType[]),
          ].forEach((possibleType: AMModelType) => {
            fields[possibleType.name] = {
              type: this.configResolver.resolveInputType(
                possibleType,
                this.links.whereUnique
              ),

              amLeave(node, transaction, stack) {
                if (
                  modelType.mmDiscriminatorField &&
                  possibleType.mmDiscriminator
                ) {
                  const lastInStack = stack.last();
                  if (lastInStack instanceof AMSelectorContext) {
                    lastInStack.addValue(
                      modelType.mmDiscriminatorField,
                      possibleType.mmDiscriminator
                    );
                  }
                }
              },
            } as AMInputFieldConfig;
          });
        }

        return fields;
      },
      ...whereTypeVisitorHandler({ emptyAllowed: false }),
    });
  }
}
