import { AMOperation } from '../operation';
import { AMDBExecutor, AMDBExecutorOperationType } from '../../definitions';
import { completeAMResultPromise } from '../resultPromise/utils';

export interface ArrayFilter {
  name: string;
  filter: any;
}

export class AMUpdateOperation extends AMOperation {
  arrayFilters: ArrayFilter[];

  async execute(executor: AMDBExecutor) {
    executor({
      type: this.many
        ? AMDBExecutorOperationType.UPDATE_MANY
        : AMDBExecutorOperationType.UPDATE_ONE,
      collection: this.collectionName,
      selector: await completeAMResultPromise(
        this.selector ? this.selector.selector : undefined
      ),
      doc: await completeAMResultPromise(
        this.data ? this.data.data : undefined
      ),
      fields: await completeAMResultPromise(
        this.fieldsSelection ? this.fieldsSelection.fields : undefined
      ),
      options: {
        arrayFilters: this.getArrayFilters(),
      },
    })
      .then(this._result.resolve)
      .catch(this._result.reject);
  }

  createArrayFilter() {
    if (!this.arrayFilters) this.arrayFilters = [];
    const newFilter = {
      name: `arrFltr${this.arrayFilters.length}`,
    } as ArrayFilter;
    this.arrayFilters.push(newFilter);
    return newFilter;
  }

  getArrayFilters() {
    if (!this.arrayFilters) return undefined;
    return this.arrayFilters.map(item => ({ [item.name]: item.filter }));
  }

  toJSON() {
    const result = super.toJSON();
    return {
      ...result,
      ...(this.arrayFilters ? { arrayFilters: this.getArrayFilters() } : null),
    };
  }
}
