import { isArray } from 'util';
import { AMModelField, AMVisitorStack } from '../../definitions';
import { ObjectFieldNode } from 'graphql';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import R from 'ramda';
import { AMDataContext } from '../../execution/contexts/data';
import { AMTransaction } from '../../execution/transaction';

export const extractValue: (any) => any = input => Object.values(input)[0];
export const makeArray = input => {
  if (isArray(input)) return input;
  else return [input];
};
