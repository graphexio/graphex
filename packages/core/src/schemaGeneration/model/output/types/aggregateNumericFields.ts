import { getNamedType, isListType } from 'graphql';
import * as R from 'ramda';
import {
  AMModelType,
  AMObjectType,
  AMTypeFactory,
} from '../../../../definitions';

export class AMAggregateNumericFieldsTypeFactory extends AMTypeFactory<AMObjectType> {
  getTypeName(modelType: AMModelType): string {
    const name = `AggregateNumericFieldsIn${modelType.name}`;
    return name;
  }
  getType(modelType: AMModelType) {
    return new AMObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = Object.values(modelType.getFields()).reduce(
          (acc, field) => {
            if (isListType(field.type)) {
              return acc;
            }
            const type = getNamedType(field.type);

            const fieldFactoryLinks =
              (this.getDynamicLinksForType(type.name)?.fieldFactories as []) ??
              [];
            const fieldFactories = this.configResolver
              .resolveFieldFactories(modelType, fieldFactoryLinks)
              .filter(fieldFactory => fieldFactory.isApplicable(field));

            return {
              ...acc,
              ...R.mergeAll(
                fieldFactories.map(fieldFactory => ({
                  [fieldFactory.getFieldName(field)]: fieldFactory.getField(
                    field
                  ),
                }))
              ),
            };
          },
          {}
        );
        return fields;
      },
    });
  }
}
