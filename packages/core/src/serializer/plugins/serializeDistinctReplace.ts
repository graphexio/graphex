import { printObjectProperties } from '../utils';
import { DistinctReplace } from '../../../src/execution/resultPromise/distinctReplace';

export const serializeDistinctReplace = {
  serialize(val: DistinctReplace, config, indentation, depth, refs, printer) {
    const obj: any = {
      data: val.dataOp.getOutput(),
      displayField: val.displayField,
      storeField: val.storeField,
      relationField: val.relationField,
      path: val.path,
    };
    if (val?.getConditions()?.length > 0) {
      obj.conditions = val.getConditions();
    }
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
