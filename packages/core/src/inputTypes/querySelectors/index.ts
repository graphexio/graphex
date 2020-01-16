import { AllSelector } from './all';
import { ExactSelector } from './exact';
import { ExistsSelector } from './exists';
import { InSelector } from './in';
import { NotInSelector } from './not_in';
import { NotSizeSelector } from './not_size';
import { SizeSelector } from './size';
import { SomeSelector } from './some';
import { SomeRelationSelector } from './some-relation';
import { AsIsSelector } from './asis';
import { AsIsRelationSelector } from './asis-relation';
import { LTSelector } from './lt';
import { LTESelector } from './lte';
import { GTSelector } from './gt';
import { GTESelector } from './gte';
import { NotSelector } from './not';
import { ContainsSelector } from './contains';
import { StartsWithSelector } from './starts_with';
import { EndsWithSelector } from './ends_with';

export const getSelectors = () => [
  SizeSelector,
  NotSizeSelector,
  ExistsSelector,
  AllSelector,
  ExactSelector,
  InSelector,
  NotInSelector,
  SomeSelector,
  SomeRelationSelector,
  AsIsSelector,
  AsIsRelationSelector,
  LTSelector,
  LTESelector,
  GTSelector,
  GTESelector,
  NotSelector,
  ContainsSelector,
  StartsWithSelector,
  EndsWithSelector,
];
