import { AMOperation } from '../operation';
import { AMDBExecutor, AMDBExecutorOperationType } from '../../definitions';
import { completeAMResultPromise } from '../resultPromise/utils';

import R from 'ramda';
import { DBRef } from 'mongodb';

export class AMDeleteDBRefOperation extends AMOperation {
  async execute(executor: AMDBExecutor) {
    try {
      const refList = (await completeAMResultPromise(
        this.dbRefList || [this.dbRef]
      )) as DBRef[];
      const groupedRefs = R.groupBy(R.prop('namespace'), refList);

      const result = Object.fromEntries(
        await Promise.all(
          Object.entries(groupedRefs).map(async ([collectionName, refs]) => {
            const data = await executor({
              type: AMDBExecutorOperationType.DELETE_MANY,
              collection: collectionName,
              selector: { _id: { $in: refs.map(ref => ref.oid) } },
              fields: await completeAMResultPromise(
                this.fieldsSelection ? this.fieldsSelection.fields : undefined
              ),
              options: { sort: this.orderBy },
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
