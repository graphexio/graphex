import { AMOperation } from '../operation';
import { AMDBExecutor, AMDBExecutorOperationType } from '../../definitions';
import { completeAMResultPromise } from '../utils';
import { AMTransaction } from '../transaction';
import R from 'ramda';
import { DBRef } from 'mongodb';

type NormalizedRepresentation = {
  collectionName: string;
  selector: { [key: string]: any };
  typename: string;
};
export class AMReadEntitiesOperation extends AMOperation {
  private representations: NormalizedRepresentation[];

  setRepresentations(representations: NormalizedRepresentation[]) {
    this.representations = representations;
  }

  async execute(executor: AMDBExecutor) {
    try {
      const groupedRefs = R.groupBy(
        R.prop('collectionName'),
        this.representations
      );

      const resultData = Object.fromEntries(
        await Promise.all(
          Object.entries(groupedRefs).map(
            async ([collectionName, representations]) => {
              let data = await executor({
                type: AMDBExecutorOperationType.FIND,
                collection: collectionName,
                selector: { $or: representations.map(rep => rep.selector) },
              });

              return [collectionName, data];
            }
          )
        )
      );

      const result = this.representations.map(rep => {
        const keys = Object.keys(rep.selector);
        const dataArr = resultData[rep.collectionName] as {}[];
        const match = R.find(item => {
          keys.forEach(key => {
            if (item[key] !== rep[key]) {
              return false;
            }
          });
          return true;
        }, dataArr);

        if (!match) return null;
        return { ...match, __typename: rep.typename };
      });

      this._result.resolve(result);
    } catch (err) {
      this._result.reject(err);
    }
  }

  toJSON() {
    return {
      identifier: this.getIdentifier(),
      kind: this.constructor.name,
      collectionName: this.collectionName,
      output: this.getOutput(),
      representations: this.representations,
    };
  }
}
