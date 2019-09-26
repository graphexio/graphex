export { default as QuerySelector } from './interface';

import QuerySelector from './interface';
import AllSelector from './all';
import ExactSelector from './exact';
import ExistsSelector from './exists';
import InSelector from './in';
import NotInSelector from './not_in';
import NotSizeSelector from './not_size';
import SizeSelector from './size';
import SomeSelector from './some';
import AsIsSelector from './asis';
import LTSelector from './lt';
import LTESelector from './lte';
import GTSelector from './gt';
import GTESelector from './gte';
import NotSelector from './not';
import ContainsSelector from './contains';
import StartsWithSelector from './starts_with';
import EndsWithSelector from './ends_with';

// We should add more selectors
// 'icontains',
// 'not_contains',
// 'not_icontains',
// 'istarts_with',
// 'not_starts_with',
// 'not_istarts_with',
// 'iends_with',
// 'not_ends_with',
// 'not_iends_with',

export const Selectors = [
  SizeSelector,
  NotSizeSelector,
  ExistsSelector,
  AllSelector,
  ExactSelector,
  InSelector,
  NotInSelector,
  SomeSelector,
  AsIsSelector,
  LTSelector,
  LTESelector,
  GTSelector,
  GTESelector,
  NotSelector,
  ContainsSelector,
  StartsWithSelector,
  EndsWithSelector,
];
