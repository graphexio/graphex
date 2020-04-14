import { printObjectProperties } from '../utils';
import { DbRefReplace } from '../../../src/execution/resultPromise/dbRefReplace';

export const serializeDbRefReplace = {
  serialize(val: DbRefReplace, config, indentation, depth, refs, printer) {
    const obj: any = {
      path: val.path,
      displayField: val.displayField,
      storeField: val.storeField,
      data: val.dataOp.getOutput(),
    };
    if (val?.conditions?.length > 0) {
      obj.conditions = val.conditions;
    }
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
