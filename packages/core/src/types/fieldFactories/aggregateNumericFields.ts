import { getNamedType } from 'graphql';
import { AMFieldFactory, AMModelField, AMModelType } from '../../definitions';
import { isEmbeddedType } from '../../utils';
import { defaultSelectionVisitorHandler } from '../visitorHandlers';

export class AMAggregateNumericFieldsFieldFactory extends AMFieldFactory {
  isApplicable(field: AMModelField) {
    return isEmbeddedType(getNamedType(field.type));
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
