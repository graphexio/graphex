export { QuerySelector } from './interface';

import { QuerySelector } from './interface';
import SizeSelector from './size';
import NotSizeSelector from './not_size';
import ExistsSelector from './exists';
import AllSelector from './all';
import { GraphQLOutputType } from 'graphql';

export const Selectors: QuerySelector[] = [
  SizeSelector,
  NotSizeSelector,
  ExistsSelector,
  AllSelector,
];
