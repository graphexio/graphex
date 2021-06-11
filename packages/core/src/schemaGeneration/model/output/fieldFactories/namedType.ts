import { AMFieldFactory, AMModelField } from '../../../../definitions';
import { defaultSelectionVisitorHandler } from '../visitorHandlers';
import { getNamedType } from 'graphql';

export class AMNamedTypeFieldFactory extends AMFieldFactory {
  isApplicable() {
    return true;
  }
  getFieldName(field: AMModelField): string {
    return field.name;
  }
  getField(field: AMModelField) {
    return {
      type: getNamedType(field.type),
      dbName: field.dbName,
      ...defaultSelectionVisitorHandler(field.dbName),
    } as AMModelField;
  }
}
