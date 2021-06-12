export const AND = Symbol('and');
export const OR = Symbol('or');
export const ALL = Symbol('all');
export const CONTAINS = Symbol('contains');
export const ENDS_WITH = Symbol('endsWith');
export const EXACT = Symbol('exact');
export const EXISTS = Symbol('exists');
export const GT = Symbol('gt');
export const GTE = Symbol('gte');
export const IN = Symbol('in');
export const LT = Symbol('lt');
export const LTE = Symbol('lte');
export const NOT_IN = Symbol('notIn');
export const NOT_SIZE = Symbol('notSize');
export const NOT = Symbol('not');
export const SIZE = Symbol('size');
export const SOME = Symbol('some');
export const STARTS_WITH = Symbol('startsWith');

export const OPERATORS = [
  ALL,
  CONTAINS,
  ENDS_WITH,
  EXACT,
  EXISTS,
  GT,
  GTE,
  IN,
  LT,
  LTE,
  NOT_IN,
  NOT_SIZE,
  NOT,
  SIZE,
  SOME,
  STARTS_WITH,
] as const;

export const SelectorOperators = {
  AND,
  OR,
  ALL,
  CONTAINS,
  ENDS_WITH,
  EXACT,
  EXISTS,
  GT,
  GTE,
  IN,
  LT,
  LTE,
  NOT_IN,
  NOT_SIZE,
  NOT,
  SIZE,
  SOME,
  STARTS_WITH,
} as const;

type Scalar = string | number | boolean | Date | null | any;
type Value =
  | Scalar
  | {
      [ALL]?: any[];
      [CONTAINS]?: string;
      [ENDS_WITH]?: string;
      [EXACT]?: any[];
      [EXISTS]?: boolean;
      [GT]?: string | number | Date;
      [GTE]?: string | number | Date;
      [IN]?: Scalar[];
      [LT]?: string | number | Date;
      [LTE]?: string | number | Date;
      [NOT_IN]?: Scalar[];
      [NOT_SIZE]?: number;
      [NOT]?: any;
      [SIZE]?: number;
      [SOME]?: any;
      [STARTS_WITH]?: string;
    };

export type Selector = {
  [AND]?: Selector[];
  [OR]?: Selector[];
  [fieldName: string]: Value;
};
