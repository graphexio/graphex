import { find } from 'ramda';
import { print, ArgumentNode } from 'graphql';

/**
 * Code copied from here https://github.com/graphql/graphql-js/blob/v14.6.0/src/validation/rules/OverlappingFieldsCanBeMerged.js#L643
 */

export function sameArguments(
  arguments1: ReadonlyArray<ArgumentNode>,
  arguments2: ReadonlyArray<ArgumentNode>
): boolean {
  if (arguments1.length !== arguments2.length) {
    return false;
  }
  return arguments1.every(argument1 => {
    const argument2 = find(
      argument => argument.name.value === argument1.name.value,
      arguments2
    );
    if (!argument2) {
      return false;
    }
    return sameValue(argument1.value, argument2.value);
  });
}

function sameValue(value1, value2) {
  return print(value1) === print(value2);
}

/**
 * End of copied code
 */
