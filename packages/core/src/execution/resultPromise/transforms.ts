import { Distinct } from './distinct';
import { DistinctReplace } from './distinctReplace';
import { Lookup } from './lookup';
import { Path } from './path';
import { ToDbRef } from './toDbRef';
import { DbRefReplace } from './dbRefReplace';
import { TransformArray } from './transformArray';
import { IndexBy } from './indexBy';
import { Join } from './join';
import { GroupBy } from './groupBy';

export const ResultPromiseTransforms = {
  Distinct,
  DistinctReplace,
  Lookup,
  Path,
  ToDbRef,
  DbRefReplace,
  TransformArray,
  IndexBy,
  Join,
  GroupBy,
  WildcardCondition: new Map(),
};
