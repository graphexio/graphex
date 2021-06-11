import { AMOperation } from '../operation';
import { DataSourceAdapter } from '@graphex/abstract-datasource-adapter';
import { completeAMResultPromise } from '../resultPromise/utils';

export class AMCreateOperation extends AMOperation {
  async execute(adapter: DataSourceAdapter) {
    const operation = this.many
      ? adapter.insertMany({
          collectionName: this.collectionName,
          docs: await completeAMResultPromise(this.dataList.values),
        })
      : adapter.insertOne({
          collectionName: this.collectionName,
          doc: await completeAMResultPromise(this.data.data),
        });

    operation.then(this._result.resolve).catch(this._result.reject);
  }
}
