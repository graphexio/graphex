import { AMModelType } from '../../definitions';
import { AMContext } from '../context';
import { AMFieldsSelectionContext } from './fieldsSelection';

export class AMFragmentContext extends AMContext {
  constructor(
    private options?: {
      fieldsSelectionContext?: AMFieldsSelectionContext;
      contextType?: AMModelType;
      conditionType?: AMModelType;
      actualConditionType?: AMModelType;
    }
  ) {
    super();
  }

  getFieldsSelectionContext() {
    return this.options.fieldsSelectionContext;
  }

  getActualConditionType() {
    return this.options.actualConditionType;
  }
}
