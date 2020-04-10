import { AMResultPromise, Transformation } from './resultPromise';
import { getPath } from './utils';

export class Distinct extends Transformation {
  constructor(public path: string) {
    super();
  }
  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    const pathArr = this.path.split('.');
    source.getPromise().then(value => {
      let dValue = getPath(pathArr)(value) || [];
      if (!Array.isArray(dValue)) dValue = [dValue];
      dest.resolve(dValue);
    });
    source.getPromise().catch(dest.reject);
  }
}
