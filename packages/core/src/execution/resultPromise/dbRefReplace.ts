import { DBRef } from 'mongodb';
import { AMOperation } from '../operation';
import { RelationTransformation } from './relationTransformation';
import { AMResultPromise } from './resultPromise';
import { mapPath } from './utils';

export class DbRefReplace extends RelationTransformation {
  constructor(
    public path: string[],
    public displayField: string,
    public storeField: string,
    public dataOp: AMOperation
  ) {
    super();
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    source.then(async value => {
      const dataMap = await this.dataOp.getOutput().getPromise();
      const mapItem = item => {
        if (!item) return item;
        const ref: DBRef | DBRef[] = item[this.storeField];
        if (!ref) return item;
        let resultValue;
        if (Array.isArray(ref)) {
          resultValue = ref.map(ref => ({
            ...dataMap[ref.namespace][ref.oid.toHexString()],
            mmCollectionName: ref.namespace,
          }));
        } else {
          resultValue = {
            ...dataMap[ref.namespace][ref.oid.toHexString()],
            mmCollectionName: ref.namespace,
          };
        }
        return { ...item, [this.displayField]: resultValue };
      };
      const newValue = mapPath(
        this.path,
        mapItem,
        [],
        this.getConditions()
      )(value);
      dest.resolve(newValue);
    });
    source.catch(dest.reject);
  }
}
