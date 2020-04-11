import { printObjectProperties } from '../utils';

export const serializeDbRefReplace = {
  serialize(val, config, indentation, depth, refs, printer) {
    const obj = {
      data: val.dataOp.getOutput(),
      path: val.path,
    };
    return (
      'DbRefReplace {' +
      printObjectProperties(obj, config, indentation, depth, refs, printer) +
      '}'
    );
  },
  test(val) {
    if (val?.constructor?.name === 'DbRefReplace') {
      return true;
    }
  },
};
