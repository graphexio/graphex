import { AMFieldFactory, AMModelField, AMModelType } from '../../definitions';
import { defaultSelectionVisitorHandler } from '../visitorHandlers';
import { getNamedType, isObjectType } from 'graphql';

export class AMAggregateNumericFieldsFieldFactory extends AMFieldFactory {
  isApplicable(field: AMModelField) {
    const type = getNamedType(field.type);
    return isObjectType(type) && (type as AMModelType).mmEmbedded;
  }
  getFieldName(field: AMModelField): string {
    return field.name;
  }
  getField(field: AMModelField) {
    return {
      type: this.configResolver.resolveType(
        getNamedType(field.type) as AMModelType,
        this.links.embedded
      ),
      ...defaultSelectionVisitorHandler(field.dbName),
    } as AMModelField;
  }
}
