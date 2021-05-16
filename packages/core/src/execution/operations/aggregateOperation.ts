import { AMOperation } from '../operation';
import { AMDBExecutor, AMDBExecutorOperationType } from '../../definitions';
import { completeAMResultPromise } from '../resultPromise/utils';
import { compact } from '../../utils';

export class AMAggregateOperation extends AMOperation {
  public groupBy: string;

  async execute(executor: AMDBExecutor) {
    executor({
      type: AMDBExecutorOperationType.AGGREGATE,
      collection: this.collectionName,
      selector: await completeAMResultPromise(
        this.selector ? this.selector.selector : undefined
      ),
      fields: await completeAMResultPromise(
        this.fieldsSelection ? this.fieldsSelection.fields : undefined
      ),
      options: {
        sort: this.orderBy,
        limit: this.first,
        skip: this.skip,
        groupBy: this.groupBy,
      },
    })
      .then(this._result.resolve)
      .catch(this._result.reject);
  }

  toJSON() {
    return compact({
      ...super.toJSON(),
      groupBy: this.groupBy,
    });
  }
}
