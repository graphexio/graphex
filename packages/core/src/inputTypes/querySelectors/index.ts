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
];
