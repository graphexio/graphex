import { AMOperation } from '../operation';
import { AMDBExecutor, AMDBExecutorOperationType } from '../../types';
import { completeAMResultPromise } from '../utils';

export class AMReadOperation extends AMOperation {
  async execute(executor: AMDBExecutor) {
    executor({
      type: AMDBExecutorOperationType.FIND,
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
