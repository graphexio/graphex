import { AMOperation } from '../operation';
import { AMDBExecutor, AMDBExecutorOperationType } from '../../definitions';
import { completeAMResultPromise } from '../resultPromise/utils';

export class AMDeleteOperation extends AMOperation {
  async execute(executor: AMDBExecutor) {
    executor({
      type: this.many
        ? AMDBExecutorOperationType.DELETE_MANY
        : AMDBExecutorOperationType.DELETE_ONE,
      collection: this.collectionName,
      selector: await completeAMResultPromise(
        this.selector ? this.selector.selector : undefined
      ),
      fields: await completeAMResultPromise(
        this.fieldsSelection ? this.fieldsSelection.fields : undefined
      ),
    })
      .then(this._result.resolve)
      .catch(this._result.reject);
  }
}
