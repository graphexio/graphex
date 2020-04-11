import { printObjectProperties } from '../utils';

export const serializeDistinctReplace = {
  serialize(val, config, indentation, depth, refs, printer) {
    const obj = {
      data: val.dataOp.getOutput(),
      field: val.field,
      path: val.path,
    };
    return (
      'DistinctReplace {' +
      printObjectProperties(obj, config, indentation, depth, refs, printer) +
      '}'
    );
  },
  test(val) {
    if (val?.constructor?.name === 'DistinctReplace') {
      return true;
    }
  },
};
