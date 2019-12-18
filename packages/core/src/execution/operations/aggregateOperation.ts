import { AMOperation } from '../operation';
import { AMDBExecutor, AMDBExecutorOperationType } from '../../definitions';
import { completeAMResultPromise } from '../utils';

export class AMAggregateOperation extends AMOperation {
  async execute(executor: AMDBExecutor) {
    executor({
      type: AMDBExecutorOperationType.COUNT,
      collection: this.collectionName,
      selector: await completeAMResultPromise(
        this.selector ? this.selector.selector : undefined
      ),
      fields: await completeAMResultPromise(
        this.fieldsSelection ? this.fieldsSelection.fields : undefined
      ),
      options: { sort: this.orderBy, limit: this.first, skip: this.skip },
    })
      .then(res => {
        this._result.resolve({
          aggregate: {
            count: res,
          },
        });
      })
      .catch(this._result.reject);
  }
}
