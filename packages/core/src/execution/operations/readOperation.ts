import { AMOperation } from '../operation';
import { AMDBExecutor, AMDBExecutorOperationType } from '../../types';

export class AMReadOperation extends AMOperation {
  execute(executor: AMDBExecutor) {
    return executor({
      type: AMDBExecutorOperationType.FIND,
      collection: this.collectionName,
      selector: this.selector ? this.selector.selector : undefined,
    });
  }
}
