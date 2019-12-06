import { AMOperation } from '../operation';
import { AMDBExecutor, AMDBExecutorOperationType } from '../../types';
import { completeAMResultPromise } from '../utils';

export class AMCreateOperation extends AMOperation {
  async execute(executor: AMDBExecutor) {
    executor({
      type: this.many
        ? AMDBExecutorOperationType.INSERT_MANY
        : AMDBExecutorOperationType.INSERT_ONE,
      collection: this.collectionName,
      ...(this.data
        ? { doc: await completeAMResultPromise(this.data.data) }
        : undefined),
      ...(this.dataList
        ? { docs: await completeAMResultPromise(this.dataList.values) }
        : undefined),
      fields: await completeAMResultPromise(
        this.fieldsSelection ? this.fieldsSelection.fields : undefined
      ),
    })
      .then(this._result.resolve)
      .catch(this._result.reject);
  }
}
