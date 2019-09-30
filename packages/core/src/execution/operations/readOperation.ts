import { AMOperation } from './operation';

export class AMReadOperation extends AMOperation {
  constructor(collectionName: string) {
    super();
    this.collectionName = collectionName;
  }
}
