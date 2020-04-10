import { AMResultPromise, Transformation } from './resultPromise';
import { getPath } from './utils';

export class Path extends Transformation {
  constructor(public path: string) {
    super();
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    source.getPromise().then(async value => {
      const newValue = getPath(this.path.split('.'))(value);
      dest.resolve(newValue);
    });
    source.getPromise().catch(dest.reject);
  }
}
