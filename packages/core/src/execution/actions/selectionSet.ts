import { AMAction } from './action';

export class AMSelectionSetAction extends AMAction {
  fields: string[] = [];

  addField(fieldName: string) {
    this.fields.push(fieldName);
  }
}
