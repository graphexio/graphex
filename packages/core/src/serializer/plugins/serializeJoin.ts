import { printObjectProperties } from '../utils';
import { Join } from '../../execution/resultPromise/join';
import { reject, isNil } from 'ramda';

export const serializeJoin = {
  serialize(val: Join, config, indentation, depth, refs, printer) {
    const obj = reject(isNil)({
      data: val.params.dataOp.getOutput(),
      storeField: val.params.storeField,
      keyField: val.params.keyField,
      path: val.params.path,
      conditions: val?.getConditions()?.length > 0 && val.getConditions(),
    });

    return (
      'Join {' +
      printObjectProperties(obj, config, indentation, depth, refs, printer) +
      '}'
    );
  },
  test(val) {
    if (val?.constructor?.name === 'Join') {
      return true;
    }
  },
};
