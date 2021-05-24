import prettyFormat from 'pretty-format';

export default {
  print(val: any) {
    return prettyFormat(val, {
      callToJSON: true,
      plugins: [],
    });
  },
  test() {
    return true;
  },
};
