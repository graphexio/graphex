import { AMResultPromise, Transformation } from './resultPromise';
import { DBRef, ObjectID } from 'mongodb';

export class ToDbRef extends Transformation {
  constructor(public collectionName: string) {
    super();
  }
  transform(
    source: AMResultPromise<ObjectID | ObjectID[]>,
    dest: AMResultPromise<DBRef | DBRef[]>
  ) {
    source.getPromise().then(async value => {
      if (Array.isArray(value)) {
        dest.resolve(value.map(id => new DBRef(this.collectionName, id)));
      } else if (value instanceof ObjectID) {
        dest.resolve(new DBRef(this.collectionName, value));
      }
    });
    source.getPromise().catch(dest.reject);
  }
}
