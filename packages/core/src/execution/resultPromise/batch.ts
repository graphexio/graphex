import { AMResultPromise, ResultPromise } from './resultPromise';

export class Batch<T> extends AMResultPromise<T[]> {
  dispatched = false;
  ids = [];

  constructor() {
    super(null);
  }

  private dispatch() {
    if (!this.dispatched) {
      this.dispatched = true;

      process.nextTick(() => {
        this.resolve(this.ids);
      });
    }
  }

  addId(id: T) {
    this.dispatch();
    if (!id) return;
    if (this.ids.includes(id)) return;

    this.ids.push(id);
  }

  addIds(ids: T[]) {
    this.dispatch();
    ids?.forEach(id => this.ids.push(id));
  }

  toJSON() {
    return new ResultPromise('<Batch>');
  }
}
