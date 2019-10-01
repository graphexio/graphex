import { AMContext } from './context';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMSelectorContext } from './contexts/selector';

export class AMOperation extends AMContext {
  collectionName: string;
  fieldsSelection: AMFieldsSelectionContext;
  selector: AMSelectorContext;

  constructor(collectionName: string) {
    super();
    this.collectionName = collectionName;
  }

  setFieldsSelection(selectionSet: AMFieldsSelectionContext) {
    this.fieldsSelection = selectionSet;
  }

  setSelector(selector: AMSelectorContext) {
    this.selector = selector;
  }
}
