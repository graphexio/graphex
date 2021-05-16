import { AMOperation } from '../operation';
import { RelationTransformation } from './relationTransformation';
import { AMResultPromise } from './resultPromise';
import { mapPath } from './utils';

export class Join extends RelationTransformation {
  constructor(
    public params: {
      dataOp: AMOperation; // data operation
      keyField: string; // name of the field where key is stored
      storeField: string; // name of the field where to store joined data
      path?: string[]; // path in parent operation to array of items to map or a single item
    }
  ) {
    super();
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    source.then(async value => {
      const dataMap = await this.params.dataOp.getOutput().getPromise();

      const mapItem = item => {
        if (!item) return item;

        const key = item[this.params.keyField];
        if (Array.isArray(key)) {
          return {
            ...item,
            [this.params.storeField]: key.map(v => dataMap[v]).filter(Boolean),
          };
        } else {
          return { ...item, [this.params.storeField]: dataMap[key] };
        }
      };

      dest.resolve(
        mapPath(
          this.params.path ?? [],
          mapItem,
          [],
          this.getConditions()
        )(value)
      );
    });
    source.catch(dest.reject);
  }
}
