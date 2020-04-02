import { AMResultPromise } from '.';
import { DBRef, ObjectID } from 'mongodb';

export const dbRef = (collectionName: string) => (
  source: AMResultPromise<any>,
  dest: AMResultPromise<any>
) => {
  source.getPromise().then(async value => {
    if (Array.isArray(value)) {
      dest.resolve(value.map(id => new DBRef(collectionName, id)));
    } else if (value instanceof ObjectID) {
      dest.resolve(new DBRef(collectionName, value));
    }
  });
  source.getPromise().catch(dest.reject);
  return `dbRef('${collectionName}')`;
};
