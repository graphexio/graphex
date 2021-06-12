import R from 'ramda';
import {
  DataSourceAdapter,
  SelectorOperators,
} from '@graphex/abstract-datasource-adapter';
import { AMOperation } from '../operation';

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

  async execute(adapter: DataSourceAdapter) {
    try {
      const groupedRefs = R.groupBy(
        R.prop('collectionName'),
        this.representations
      );

      const resultData = Object.fromEntries(
        await Promise.all(
          Object.entries(groupedRefs).map(
            async ([collectionName, representations]) => {
              const data = await adapter.findMany({
                collectionName: collectionName,
                selector: {
                  [SelectorOperators.OR]: representations.map(
                    rep => rep.selector
                  ),
                },
                fields: [], //TODO: fix
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
          let fl = true;
          keys.forEach(key => {
            if (!R.equals(item[key], rep.selector[key])) {
              fl = false;
            }
          });
          return fl;
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
