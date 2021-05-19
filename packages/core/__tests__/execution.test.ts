import { AMTransaction } from '../src/execution/transaction';
import { AMReadOperation } from '../src/execution/operations/readOperation';
import { AMSelectorContext } from '../src/execution/contexts/selector';
import { AMFieldsSelectionContext } from '../src/execution/contexts/fieldsSelection';
import { AMDBExecutorParams } from '../src/definitions';
import { AMCreateOperation } from '../src/execution/operations/createOperation';
import { AMDataContext } from '../src/execution/contexts/data';
import { AMUpdateOperation } from '../src/execution/operations/updateOperation';
import { AMListValueContext } from '../src/execution/contexts/listValue';
import { AMReadDBRefOperation } from '../src/execution/operations/readDbRefOperation';
import { DBRef, ObjectID } from 'mongodb';
import { ResultPromiseTransforms } from '../src/execution/resultPromise';
import { Path } from '../src/execution/path';

test('read many', () => {
  const executor = (params: AMDBExecutorParams) => {
    expect(params).toMatchInlineSnapshot(`
          Object {
            "collection": "posts",
            "fields": Array [
              "title",
            ],
            "options": Object {
              "limit": undefined,
              "skip": undefined,
              "sort": undefined,
            },
            "selector": Object {
              "title": "test-title",
            },
            "type": "find",
          }
    `);
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  new AMReadOperation(transaction, {
    many: true,
    collectionName: 'posts',
    selector: new AMSelectorContext({ title: 'test-title' }),
    fieldsSelection: new AMFieldsSelectionContext(['title']),
  });

  transaction.execute(executor);
});

test('read one', () => {
  const executor = (params: AMDBExecutorParams) => {
    expect(params).toMatchInlineSnapshot(`
          Object {
            "collection": "posts",
            "fields": Array [
              "title",
            ],
            "options": Object {
              "limit": undefined,
              "skip": undefined,
              "sort": undefined,
            },
            "selector": Object {
              "title": "test-title",
            },
            "type": "findOne",
          }
    `);
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  new AMReadOperation(transaction, {
    many: false,
    collectionName: 'posts',
    selector: new AMSelectorContext({ title: 'test-title' }),
    fieldsSelection: new AMFieldsSelectionContext(['title']),
  });

  return transaction.execute(executor);
});

test('read where', () => {
  const executor = (params: AMDBExecutorParams) => {
    expect(params).toMatchInlineSnapshot(`
            Object {
              "collection": "posts",
              "fields": Array [
                "title",
              ],
              "options": Object {
                "limit": undefined,
                "skip": undefined,
                "sort": undefined,
              },
              "selector": Object {
                "_id": "post-id",
              },
              "type": "findOne",
            }
      `);
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  new AMReadOperation(transaction, {
    many: false,
    collectionName: 'posts',
    selector: new AMSelectorContext({ _id: 'post-id' }),
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
                "options": Object {
                  "limit": undefined,
                  "skip": undefined,
                  "sort": undefined,
                },
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
    many: true,
    collectionName: 'posts',
    fieldsSelection: new AMFieldsSelectionContext(['title', 'commentIds']),
  });

  const subOperation = new AMReadOperation(transaction, {
    many: true,
    collectionName: 'comments',
    selector: new AMSelectorContext({
      _id: {
        $in: operation
          .getResult()
          .map(new ResultPromiseTransforms.Distinct('commentIds')),
      },
    }),
  });

  operation.setOutput(
    operation
      .getOutput()
      .map(
        new ResultPromiseTransforms.DistinctReplace(
          Path.fromArray([]),
          Path.fromString('commentIds'),
          'commentIds',
          '_id',
          subOperation
        ).addCondition(new Map())
      )
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

test('create', () => {
  const executor = (params: AMDBExecutorParams) => {
    expect(params).toMatchInlineSnapshot(`
          Object {
            "collection": "posts",
            "doc": Object {
              "title": "test-title",
            },
            "fields": Array [
              "_id",
              "title",
            ],
            "type": "insertOne",
          }
    `);
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  new AMCreateOperation(transaction, {
    many: false,
    collectionName: 'posts',
    fieldsSelection: new AMFieldsSelectionContext(['_id', 'title']),
    data: new AMDataContext({ title: 'test-title' }),
  });

  return transaction.execute(executor);
});

test('update', () => {
  const executor = (params: AMDBExecutorParams) => {
    expect(params).toMatchInlineSnapshot(`
          Object {
            "collection": "posts",
            "doc": Object {
              "$set": Object {
                "title": "new title",
              },
            },
            "fields": Array [
              "_id",
              "title",
            ],
            "options": Object {
              "arrayFilters": undefined,
            },
            "selector": Object {
              "id": "PostID",
            },
            "type": "updateOne",
          }
    `);
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  new AMUpdateOperation(transaction, {
    many: false,
    collectionName: 'posts',
    fieldsSelection: new AMFieldsSelectionContext(['_id', 'title']),
    data: new AMDataContext({ $set: { title: 'new title' } }),
    selector: new AMSelectorContext({ id: 'PostID' }),
  });

  return transaction.execute(executor);
});

test('update with arrayfilter', () => {
  const executor = (params: AMDBExecutorParams) => {
    expect(params).toMatchInlineSnapshot(`
          Object {
            "collection": "posts",
            "doc": Object {
              "$set": Object {
                "title": "new title",
              },
            },
            "fields": Array [
              "_id",
              "title",
            ],
            "options": Object {
              "arrayFilters": Array [
                Object {
                  "arrFltr0": Object {
                    "message": "test",
                  },
                },
              ],
            },
            "selector": Object {
              "id": "PostID",
            },
            "type": "updateOne",
          }
    `);
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  const operation = new AMUpdateOperation(transaction, {
    many: false,
    collectionName: 'posts',
    fieldsSelection: new AMFieldsSelectionContext(['_id', 'title']),
    data: new AMDataContext({ $set: { title: 'new title' } }),
    selector: new AMSelectorContext({ id: 'PostID' }),
  });
  operation.createArrayFilter().filter = { message: 'test' };

  return transaction.execute(executor);
});

test('create many', () => {
  const executor = (params: AMDBExecutorParams) => {
    expect(params).toMatchInlineSnapshot(`
          Object {
            "collection": "posts",
            "docs": Array [
              Object {
                "title": "new title",
              },
            ],
            "fields": undefined,
            "type": "insertMany",
          }
      `);
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  new AMCreateOperation(transaction, {
    many: true,
    collectionName: 'posts',
    dataList: new AMListValueContext([{ title: 'new title' }]),
  });

  return transaction.execute(executor);
});

test('read dbref', async () => {
  const AdminId = new ObjectID();
  const CustomerId = new ObjectID();

  let n = 0;
  const executor = (params: AMDBExecutorParams) => {
    switch (n) {
      case 0: {
        expect(params).toMatchInlineSnapshot(`
          Object {
            "collection": "admins",
            "fields": Array [
              "_id",
              "title",
            ],
            "options": Object {
              "limit": undefined,
              "skip": undefined,
              "sort": undefined,
            },
            "selector": Object {
              "_id": Object {
                "$in": Array [
                  "${AdminId}",
                ],
              },
            },
            "type": "find",
          }
        `);
        break;
      }
      case 1: {
        expect(params).toMatchInlineSnapshot(`
          Object {
            "collection": "customers",
            "fields": Array [
              "_id",
              "title",
            ],
            "options": Object {
              "limit": undefined,
              "skip": undefined,
              "sort": undefined,
            },
            "selector": Object {
              "_id": Object {
                "$in": Array [
                  "${CustomerId}",
                ],
              },
            },
            "type": "find",
          }
        `);
        break;
      }
    }
    n++;
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  new AMReadDBRefOperation(transaction, {
    many: true,
    fieldsSelection: new AMFieldsSelectionContext(['_id', 'title']),
    dbRefList: [
      new DBRef('admins', AdminId),
      new DBRef('customers', CustomerId),
    ],
  });

  return transaction.execute(executor);
});

test('orderBy', () => {
  const executor = (params: AMDBExecutorParams) => {
    expect(params).toMatchInlineSnapshot(`
      Object {
        "collection": "posts",
        "fields": undefined,
        "options": Object {
          "limit": undefined,
          "skip": undefined,
          "sort": Object {
            "_id": 1,
          },
        },
        "selector": undefined,
        "type": "findOne",
      }
      `);
    return Promise.resolve([]);
  };

  const transaction = new AMTransaction();
  new AMReadOperation(transaction, {
    many: false,
    collectionName: 'posts',
    orderBy: {
      _id: 1,
    },
  });

  return transaction.execute(executor);
});
