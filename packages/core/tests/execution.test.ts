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
                    "fields": Array [
                      "title",
                    ],
                    "selector": Object {
                      "title": "test-title",
                    },
                    "type": "find",
                  }
            `);
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  const operation = new AMReadOperation(transaction, {
    collectionName: 'posts',
    selector: new AMSelectorContext({ title: 'test-title' }),
    fieldsSelection: new AMFieldsSelectionContext(['title']),
  });

  transaction.execute(executor);
});

test('read many relation', async () => {
  let execN = 0;
  const executor = (params: AMDBExecutorParams) => {
    execN++;

    switch (execN) {
      case 1: {
        return Promise.resolve([
          { title: 'post1', commentIds: ['comment1', 'comment2'] },
          { title: 'post2', commentIds: ['comment3', 'comment4'] },
        ]);
        break;
      }
      case 2: {
        expect(params).toMatchInlineSnapshot(`
          Object {
            "collection": "comments",
            "fields": undefined,
            "selector": Object {
              "_id": Object {
                "$in": Array [
                  "comment1",
                  "comment2",
                  "comment3",
                  "comment4",
                ],
              },
            },
            "type": "find",
          }
        `);
        return Promise.resolve([
          {
            _id: 'comment1',
            message: 'message1',
          },
          {
            _id: 'comment2',
            message: 'message2',
          },
          {
            _id: 'comment3',
            message: 'message3',
          },

          {
            _id: 'comment4',
            message: 'message4',
          },
        ]);
      }
    }
  };

  const transaction = new AMTransaction();
  const operation = new AMReadOperation(transaction, {
    collectionName: 'posts',
    fieldsSelection: new AMFieldsSelectionContext(['title', 'commentIds']),
  });

  const subOperation = new AMReadOperation(transaction, {
    collectionName: 'comments',
    selector: new AMSelectorContext({
      _id: { $in: operation.getResult().distinct('commentIds') },
    }),
  });

  operation.setOutput(
    operation
      .getOutput()
      .distinctReplace('commentIds', '_id', subOperation.getOutput())
  );

  const result = await transaction.execute(executor);

  expect(result).toEqual([
    {
      title: 'post1',
      commentIds: [
        {
          _id: 'comment1',
          message: 'message1',
        },
        {
          _id: 'comment2',
          message: 'message2',
        },
      ],
    },
    {
      title: 'post2',
      commentIds: [
        {
          _id: 'comment3',
          message: 'message3',
        },
        {
          _id: 'comment4',
          message: 'message4',
        },
      ],
    },
  ]);
});
