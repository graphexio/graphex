import { AMContext } from '../context';

export class AMFieldsSelectionContext extends AMContext {
  fields: string[] = [];

  addField(fieldName: string) {
    this.fields.push(fieldName);
  }
}
