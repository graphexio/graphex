import { AMFieldFactory, AMModelField } from '../../../../definitions';
import { defaultSelectionVisitorHandler } from '../visitorHandlers';

export class AMIdentityFieldFactory extends AMFieldFactory {
  isApplicable() {
    return true;
  }
  getFieldName(field: AMModelField): string {
    return field.name;
  }
  getField(field: AMModelField) {
    return {
      type: field.type,
      dbName: field.dbName,
      ...defaultSelectionVisitorHandler(field.dbName),
    } as AMModelField;
  }
}
