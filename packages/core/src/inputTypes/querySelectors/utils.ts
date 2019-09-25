import { isArray } from 'util';

export const extractValue = input => Object.values(input)[0];
export const makeArray = input => {
  if (isArray(input)) return input;
  else return [input];
};
