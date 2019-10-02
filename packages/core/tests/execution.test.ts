import { AMTransaction } from '../src/execution/transaction';
import { AMReadOperation } from '../src/execution/operations/readOperation';
import { AMSelectorContext } from '../src/execution/contexts/selector';
import { AMFieldsSelectionContext } from '../src/execution/contexts/fieldsSelection';
import { AMDBExecutorParams } from '../src/types';

test('read many', () => {
  const executor = (params: AMDBExecutorParams) => {
    expect(params).toMatchInlineSnapshot(`
      Object {
        "collection": "posts",
        "selector": Object {
          "title": "test-title",
        },
        "type": "find",
      }
    `);
    return Promise.resolve([]);
  };

  const operation = new AMReadOperation('posts');

  const selector = new AMSelectorContext();
  selector.addValue('title', 'test-title');
  operation.setSelector(selector);

  const fieldSelection = new AMFieldsSelectionContext();
  fieldSelection.addField('title');
  operation.setFieldsSelection(fieldSelection);

  operation.execute(executor);
});
