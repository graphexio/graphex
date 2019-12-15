import { AMContext } from '../context';
import { AMFieldsSelectionContext } from './fieldsSelection';

export class AMFragmentContext extends AMContext {
  private fieldsSelectionContext: AMFieldsSelectionContext;

  constructor(options?: { fieldsSelectionContext?: AMFieldsSelectionContext }) {
    super();
    this.fieldsSelectionContext = options?.fieldsSelectionContext;
  }

  getFieldsSelectionContext() {
    return this.fieldsSelectionContext;
  }
}
