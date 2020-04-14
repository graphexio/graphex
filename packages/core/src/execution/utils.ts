import { AMContext } from './context';
import { AMOperation } from './operation';

export const isOperation = (item: AMContext): item is AMOperation => {
  return item instanceof AMOperation;
};
