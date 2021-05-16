import { indexBy, groupBy, prop } from 'ramda';
import { AMDBExecutor } from '../../definitions';
import { AMOperation } from '../operation';
import { AMResultPromise } from '../resultPromise';
import { compact } from '../../utils';
import { AMDBExecutorOperationType } from '@apollo-model/mongodb-executor';
import { completeAMResultPromise } from '../resultPromise/utils';
import { AMFieldsSelectionContext } from '../contexts';

export class AMConnectionOperation extends AMOperation {
  public keys: AMResultPromise<any[]>;
  public groupBy: string;
  public nodesSelectionContext: AMFieldsSelectionContext;

  async execute(executor: AMDBExecutor) {
    const counts = await executor({
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
    });

    const nodes = await executor({
      type: AMDBExecutorOperationType.FIND,
      collection: this.collectionName,
      selector: await completeAMResultPromise(
        this.selector ? this.selector.selector : undefined
      ),
      fields: [
        ...(
          await completeAMResultPromise(
            this.nodesSelectionContext
              ? this.nodesSelectionContext.fields
              : undefined
          )
        ).map(f => f.split('.').slice(1).join('.')),
        this.groupBy,
      ],
      options: {
        sort: this.orderBy,
        limit: this.first,
        skip: this.skip,
        groupBy: this.groupBy,
      },
    });

    const keys = await this.keys?.getPromise();
    if (keys) {
      const indexedCounts = indexBy(prop(this.groupBy), counts);
      const indexedNodes = groupBy(prop(this.groupBy), nodes);
      console.log(indexedNodes);
      this._result.resolve(
        keys.map(_k => ({
          _k,
          nodes: indexedNodes[_k],
          aggregate: { count: indexedCounts[_k]?.['count'] ?? 0 },
          totalCount: indexedCounts[_k]?.['count'] ?? 0,
        }))
      );
    } else {
      this._result.resolve({
        nodes,
        aggregate: { count: counts[0]?.['count'] ?? 0 },
        totalCount: counts[0]?.['count'] ?? 0,
      });
    }
  }

  toJSON() {
    return compact({
      ...super.toJSON(),
      keys: this.keys,
    });
  }
}
