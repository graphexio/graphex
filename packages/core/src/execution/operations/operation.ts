import { AMAction } from '../actions/action';
import { AMSelectionSetAction } from '../actions/selectionSet';

export class AMOperation {
  collectionName: string;
  selectionSet: AMSelectionSetAction;
  actions: AMAction[] = [];

  addAction(action: AMAction) {
    this.actions.push(action);
  }

  setSelectionSet(selectionSet: AMSelectionSetAction) {
    this.selectionSet = selectionSet;
  }
}
