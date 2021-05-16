import { printObjectProperties } from '../utils';

export const serializeLookup = {
  serialize(val, config, indentation, depth, refs, printer) {
    const obj: any = {
      data: val.dataOp.getOutput(),
      many: val.many,
      path: val.path,
      displayFieldPath: val.displayFieldPath,
      relationField: val.relationField,
      storeField: val.storeField,
    };
    if (val?.conditions?.length > 0) {
      obj.conditions = val.conditions;
    }
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
