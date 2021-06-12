import * as R from 'ramda';
import { SelectorOperators } from '@graphex/abstract-datasource-adapter';
import { ObjectEntriesWithSymbols } from '../../utils';
import { AMResultPromise, Transformation } from './resultPromise';
import { mapPath, completeAMResultPromise } from './utils';

type MakePredicate = (...args) => R.Pred;

const makeSimplePredicate: MakePredicate = (
  key: string,
  value: any
) => item => {
  return item[key] === value;
};

const makeRegExPredicate: MakePredicate = (
  key: string,
  regex: RegExp
) => item => {
  return regex.test(item[key]);
};

const makeElemMatchPredicate: MakePredicate = (key: string, cond: RegExp) => {
  const predicate = makeObjectPredicate(cond);
  return item => {
    const arr = item[key];
    if (Array.isArray(arr)) {
      return arr.findIndex(predicate) !== -1;
    } else {
      return false;
    }
  };
};

const makeAllPredicate: MakePredicate = (
  key: string,
  matchingItems: any[]
) => item => {
  const arr = item[key];
  if (Array.isArray(arr) && Array.isArray(matchingItems)) {
    const arrMap = new Map<string, true>();
    arr.forEach(arrItem => {
      arrMap.set(JSON.stringify(arrItem), true);
    });
    for (const matchingItem of matchingItems) {
      if (!arrMap.has(JSON.stringify(matchingItem))) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
};

const makeExistsPredicate: MakePredicate = (
  key: string,
  exists: boolean
) => item => {
  if (exists) {
    return item[key] !== undefined;
  } else {
    return item[key] === undefined;
  }
};

enum Condition {
  gt,
  gte,
  lt,
  lte,
}
const makeEqPredicate: MakePredicate = (key: string, value: any) => item => {
  return R.equals(item[key], value);
};

const makeComparisonPredicate: MakePredicate = (
  key: string,
  value: any,
  condition: Condition
) => item => {
  switch (condition) {
    case Condition.gt:
      return item[key] > value;
    case Condition.gte:
      return item[key] >= value;
    case Condition.lt:
      return item[key] < value;
    case Condition.lte:
      return item[key] <= value;
  }
};

const makeInPredicate: MakePredicate = (key: string, arr: any) => item => {
  if (Array.isArray(arr)) {
    const searchMap = new Map<any, true>();

    arr.forEach(arrItem => {
      if (typeof arrItem === 'object') {
        searchMap.set(JSON.stringify(arrItem), true);
      } else {
        searchMap.set(arrItem, true);
      }
    });

    const value = item[key];
    if (Array.isArray(value)) {
      for (const valueItem of value) {
        let searchValue = valueItem;
        if (typeof valueItem === 'object') {
          searchValue = JSON.stringify(valueItem);
        }
        if (searchMap.has(searchValue)) {
          return true;
        }
      }
      return false;
    } else {
      let searchValue = value;
      if (typeof value === 'object') {
        searchValue = JSON.stringify(value);
      }
      return searchMap.has(searchValue);
    }
  } else {
    return false;
  }
};

const makeSizePredicate: MakePredicate = (key: string, value: any) => item => {
  return item[key]?.length === value;
};

const makeNotPredicate: MakePredicate = (key: string, value: any) => {
  return R.complement(makePredicate(key, value));
};

const makeAndPredicate: MakePredicate = (values: any) => {
  const predicates = values.map(value => makeObjectPredicate(value));
  return R.allPass(predicates);
};

const makeOrPredicate: MakePredicate = (values: any) => {
  const predicates = values.map(value => makeObjectPredicate(value));
  return R.anyPass(predicates);
};

const makeObjectPredicate: MakePredicate = (cond: { [key: string]: any }) => {
  const predicates = ObjectEntriesWithSymbols(cond).map(([key, value]) =>
    makePredicate(key, value)
  );
  return R.allPass(predicates);
};

const makePredicate: MakePredicate = (key, value) => {
  if (key === SelectorOperators.AND) {
    return makeAndPredicate(value);
  } else if (key === SelectorOperators.OR) {
    return makeOrPredicate(value);
  }
  if (typeof value === 'object') {
    if (value[SelectorOperators.STARTS_WITH] !== undefined) {
      return makeRegExPredicate(
        key,
        new RegExp(`^${value[SelectorOperators.STARTS_WITH]}`)
      );
    } else if (value[SelectorOperators.CONTAINS] !== undefined) {
      return makeRegExPredicate(
        key,
        new RegExp(value[SelectorOperators.CONTAINS])
      );
    } else if (value[SelectorOperators.ENDS_WITH] !== undefined) {
      return makeRegExPredicate(
        key,
        new RegExp(`${value[SelectorOperators.ENDS_WITH]}$`)
      );
    } else if (value[SelectorOperators.SOME] !== undefined) {
      return makeElemMatchPredicate(key, value[SelectorOperators.SOME]);
    } else if (value[SelectorOperators.ALL] !== undefined) {
      return makeAllPredicate(key, value[SelectorOperators.ALL]);
    } else if (value[SelectorOperators.EXACT] !== undefined) {
      return makeEqPredicate(key, value[SelectorOperators.EXACT]);
    } else if (value[SelectorOperators.EXISTS] !== undefined) {
      return makeExistsPredicate(key, value[SelectorOperators.EXISTS]);
    } else if (value[SelectorOperators.GT] !== undefined) {
      return makeComparisonPredicate(
        key,
        value[SelectorOperators.GT],
        Condition.gt
      );
    } else if (value[SelectorOperators.GTE] !== undefined) {
      return makeComparisonPredicate(
        key,
        value[SelectorOperators.GTE],
        Condition.gte
      );
    } else if (value[SelectorOperators.LT] !== undefined) {
      return makeComparisonPredicate(
        key,
        value[SelectorOperators.LT],
        Condition.lt
      );
    } else if (value[SelectorOperators.LTE] !== undefined) {
      return makeComparisonPredicate(
        key,
        value[SelectorOperators.LTE],
        Condition.lte
      );
    } else if (value[SelectorOperators.IN] !== undefined) {
      return makeInPredicate(key, value[SelectorOperators.IN]);
    } else if (value[SelectorOperators.SIZE] !== undefined) {
      return makeSizePredicate(key, value[SelectorOperators.SIZE]);
    } else if (value[SelectorOperators.NOT] !== undefined) {
      return makeNotPredicate(key, value[SelectorOperators.NOT]);
    }
  }
  return makeSimplePredicate(key, value);
};

export class TransformArray extends Transformation {
  constructor(
    public path: string[],
    public displayField: string,
    public storeField: string,
    public filterParams: { where: { [key: string]: any } }
  ) {
    super();
  }
  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    source.then(async value => {
      const filter = makeObjectPredicate(
        await completeAMResultPromise(this.filterParams.where)
      );

      const mapItem = item => {
        const arr = item[this.storeField];
        if (Array.isArray(arr)) {
          return {
            ...item,
            [this.displayField]: arr.filter(filter),
          };
        } else {
          return item;
        }
      };

      const newValue = mapPath(this.path, mapItem)(value);
      dest.resolve(newValue);
    });
    source.catch(dest.reject);
  }
}
