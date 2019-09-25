export { QuerySelector } from './interface';

import AllSelector from './all';
import ExactSelector from './exact';
import ExistsSelector from './exists';
import InSelector from './in';
import { QuerySelector } from './interface';
import NotInSelector from './not_in';
import NotSizeSelector from './not_size';
import SizeSelector from './size';
import SomeSelector from './some';

export const Selectors: QuerySelector[] = [
  SizeSelector,
  NotSizeSelector,
  ExistsSelector,
  AllSelector,
  ExactSelector,
  InSelector,
  NotInSelector,
  SomeSelector,
];
