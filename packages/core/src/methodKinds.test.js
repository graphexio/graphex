import {
  SINGLE_QUERY,
  MULTIPLE_QUERY,
  CONNECTION_QUERY,
  MULTIPLE_PAGINATION_QUERY,
  CREATE_MUTATION,
  DELETE_MUTATION,
  DELETE_MANY_MUTATION,
  UPDATE_MUTATION,
  getMethodName,
} from './methodKinds.js';

test('getMethodName', () => {
  let modelName = 'Brand';
  expect(getMethodName(SINGLE_QUERY)(modelName)).toEqual('brand');
  expect(getMethodName(MULTIPLE_QUERY)(modelName)).toEqual('brands');
  expect(getMethodName(CONNECTION_QUERY)(modelName)).toEqual(
    'brandsConnection'
  );
  expect(getMethodName(MULTIPLE_PAGINATION_QUERY)(modelName)).toEqual(
    'brandsPaged'
  );
  expect(getMethodName(CREATE_MUTATION)(modelName)).toEqual('createBrand');
  expect(getMethodName(DELETE_MUTATION)(modelName)).toEqual('deleteBrand');
  expect(getMethodName(DELETE_MANY_MUTATION)(modelName)).toEqual(
    'deleteBrands'
  );
  expect(getMethodName(UPDATE_MUTATION)(modelName)).toEqual('updateBrand');
});
