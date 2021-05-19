import { indexBy, prop } from 'ramda';
import { AMResultPromise, Transformation } from './resultPromise';

export class IndexBy extends Transformation {
  constructor(public params: { groupingField: string }) {
    super();
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    source.getPromise().then(async value => {
      dest.resolve(indexBy(prop(this.params.groupingField), value));
    });
    source.getPromise().catch(dest.reject);
  }
}
