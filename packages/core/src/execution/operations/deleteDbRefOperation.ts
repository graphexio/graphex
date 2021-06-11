import { AMOperation } from '../operation';
import { DataSourceAdapter } from '@graphex/abstract-datasource-adapter';
import { completeAMResultPromise } from '../resultPromise/utils';

import R from 'ramda';
import { DBRef } from 'mongodb';

export class AMDeleteDBRefOperation extends AMOperation {
  async execute(adapter: DataSourceAdapter) {
    try {
      const refList = (await completeAMResultPromise(
        this.dbRefList || [this.dbRef]
      )) as DBRef[];
      const groupedRefs = R.groupBy(R.prop('namespace'), refList);

      const result = Object.fromEntries(
        await Promise.all(
          Object.entries(groupedRefs).map(async ([collectionName, refs]) => {
            const data = await adapter.deleteMany({
              collectionName: collectionName,
              selector: { _id: { $in: refs.map(ref => ref.oid) } },
            });

            return [collectionName, data];
          })
        )
      );
      this._result.resolve(result);
    } catch (err) {
      this._result.reject(err);
    }
  }
}
