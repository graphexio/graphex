import { AMOperation } from '../operation';
import { completeAMResultPromise } from '../resultPromise/utils';
import { DataSourceAdapter } from '@graphex/abstract-datasource-adapter';

export class AMReadOperation extends AMOperation {
  async execute(adapter: DataSourceAdapter) {
    const selector = await completeAMResultPromise(
      this.selector ? this.selector.selector : undefined
    );
    const fields = await completeAMResultPromise(
      this.fieldsSelection ? this.fieldsSelection.fields : undefined
    );

    const operation = this.many
      ? adapter.findMany({
          collectionName: this.collectionName,
          selector,
          fields,
          sort: this.orderBy,
          limit: this.first,
          skip: this.skip,
        })
      : adapter.findOne({
          collectionName: this.collectionName,
          selector,
          fields,
        });

    operation.then(this._result.resolve).catch(this._result.reject);
  }
}
