import { printObjectProperties } from '../utils';

export const serializeLookup = {
  serialize(val, config, indentation, depth, refs, printer) {
    const obj = {
      data: val.dataOp.getOutput(),
      many: val.many,
      path: val.path,
      relationField: val.relationField,
      storeField: val.storeField,
    };
    return (
      'Lookup {' +
      printObjectProperties(obj, config, indentation, depth, refs, printer) +
      '}'
    );
  },
  test(val) {
    if (val?.constructor?.name === 'Lookup') {
      return true;
    }
  },
};
