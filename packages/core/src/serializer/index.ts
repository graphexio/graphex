import prettyFormat from 'pretty-format';
import { serializeLookup } from './plugins/serializeLookup';
import { serializeDistinctReplace } from './plugins/serializeDistinctReplace';
import { serializeDbRefReplace } from './plugins/serializeDbRefReplace';
import { serializeJoin } from './plugins/serializeJoin';

export default {
  print(val: any) {
    return prettyFormat(val, {
      callToJSON: true,
      plugins: [
        serializeLookup,
        serializeDistinctReplace,
        serializeDbRefReplace,
        serializeJoin,
      ],
    });
  },
  test() {
    return true;
  },
};
