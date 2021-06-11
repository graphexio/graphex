import { AMOperation } from '../operation';
import { DataSourceAdapter } from '@graphex/abstract-datasource-adapter';
import { completeAMResultPromise } from '../resultPromise/utils';
import { compact } from '../../utils';

export class AMAggregateOperation extends AMOperation {
  public groupBy: string;

  async execute(adapter: DataSourceAdapter) {
    adapter
      .aggregate({
        collectionName: this.collectionName,
        selector: await completeAMResultPromise(
          this.selector ? this.selector.selector : undefined
        ),
        // groupBy: this.groupBy, TODO: fix
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
