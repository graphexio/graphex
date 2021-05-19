import { RelationInfo } from '../../definitions';
import { AMOperation } from '../operation';

export class AMConnectionOperation extends AMOperation {
  public relationInfo: RelationInfo;

  async execute() {
    this._result.resolve({});
  }
}
