import { AMOperation } from '../operation';
import { DataSourceAdapter } from '@graphex/abstract-datasource-adapter';
import { completeAMResultPromise } from '../resultPromise/utils';

export class AMDeleteOperation extends AMOperation {
  async execute(adapter: DataSourceAdapter) {
    (this.many ? adapter.deleteMany : adapter.deleteOne)({
      collectionName: this.collectionName,
      selector: await completeAMResultPromise(
        this.selector ? this.selector.selector : undefined
      ),
    })
      .then(this._result.resolve)
      .catch(this._result.reject);
  }
}
