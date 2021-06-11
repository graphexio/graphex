import { DBRef, ObjectID } from 'mongodb';
import { DataSourceAdapter } from '@graphex/abstract-datasource-adapter';
import { AMDataContext } from '../src/execution/contexts/data';
import { AMFieldsSelectionContext } from '../src/execution/contexts/fieldsSelection';
import { AMListValueContext } from '../src/execution/contexts/listValue';
import { AMSelectorContext } from '../src/execution/contexts/selector';
import { AMCreateOperation } from '../src/execution/operations/createOperation';
import { AMReadDBRefOperation } from '../src/execution/operations/readDbRefOperation';
import { AMReadOperation } from '../src/execution/operations/readOperation';
import { AMUpdateOperation } from '../src/execution/operations/updateOperation';
import { AMTransaction } from '../src/execution/transaction';

test('read many', () => {
  const adapter: Partial<DataSourceAdapter> = {
    findMany(params) {
      expect(params).toMatchInlineSnapshot(`
            Object {
              "collectionName": "posts",
              "fields": Array [
                "title",
              ],
              "limit": undefined,
              "selector": Object {
                "title": "test-title",
              },
              "skip": undefined,
              "sort": undefined,
            }
      `);
      return Promise.resolve([]);
    },
  };

  const transaction = new AMTransaction(new Map());
  new AMReadOperation(transaction, {
    many: true,
    collectionName: 'posts',
    selector: new AMSelectorContext({ title: 'test-title' }),
    fieldsSelection: new AMFieldsSelectionContext(['title']),
  });

  return transaction.execute(adapter as DataSourceAdapter);
});

test('read one', () => {
  const adapter: Partial<DataSourceAdapter> = {
    findOne(params) {
      expect(params).toMatchInlineSnapshot(`
          Object {
            "collectionName": "posts",
            "fields": Array [
              "title",
            ],
            "selector": Object {
              "title": "test-title",
            },
          }
      `);
      return Promise.resolve([]);
    },
  };

  const transaction = new AMTransaction(new Map());
  new AMReadOperation(transaction, {
    many: false,
    collectionName: 'posts',
    selector: new AMSelectorContext({ title: 'test-title' }),
    fieldsSelection: new AMFieldsSelectionContext(['title']),
  });

  return transaction.execute(adapter as DataSourceAdapter);
});

test('read where', () => {
  const adapter: Partial<DataSourceAdapter> = {
    findOne(params) {
      expect(params).toMatchInlineSnapshot(`
            Object {
              "collectionName": "posts",
              "fields": Array [
                "title",
              ],
              "selector": Object {
                "_id": "post-id",
              },
            }
      `);
      return Promise.resolve([]);
    },
  };

  const transaction = new AMTransaction(new Map());
  new AMReadOperation(transaction, {
    many: false,
    collectionName: 'posts',
    selector: new AMSelectorContext({ _id: 'post-id' }),
    fieldsSelection: new AMFieldsSelectionContext(['title']),
  });

  return transaction.execute(adapter as DataSourceAdapter);
});

test('create', () => {
  const adapter: Partial<DataSourceAdapter> = {
    insertOne(params) {
      expect(params).toMatchInlineSnapshot(`
          Object {
            "collectionName": "posts",
            "doc": Object {
              "title": "test-title",
            },
          }
    `);
      return Promise.resolve([]);
    },
  };

  const transaction = new AMTransaction(new Map());
  new AMCreateOperation(transaction, {
    many: false,
    collectionName: 'posts',
    fieldsSelection: new AMFieldsSelectionContext(['_id', 'title']),
    data: new AMDataContext({ title: 'test-title' }),
  });

  return transaction.execute(adapter as DataSourceAdapter);
});

test('update', () => {
  const adapter: Partial<DataSourceAdapter> = {
    updateOne(params) {
      expect(params).toMatchInlineSnapshot(`
          Object {
            "arrayFilters": undefined,
            "collectionName": "posts",
            "doc": Object {
              "$set": Object {
                "title": "new title",
              },
            },
            "selector": Object {
              "id": "PostID",
            },
          }
    `);
      return Promise.resolve([]);
    },
  };

  const transaction = new AMTransaction(new Map());
  new AMUpdateOperation(transaction, {
    many: false,
    collectionName: 'posts',
    fieldsSelection: new AMFieldsSelectionContext(['_id', 'title']),
    data: new AMDataContext({ $set: { title: 'new title' } }),
    selector: new AMSelectorContext({ id: 'PostID' }),
  });

  return transaction.execute(adapter as DataSourceAdapter);
});

test('update with arrayfilter', () => {
  const adapter: Partial<DataSourceAdapter> = {
    updateOne(params) {
      expect(params).toMatchInlineSnapshot(`
          Object {
            "arrayFilters": Array [
              Object {
                "arrFltr0": Object {
                  "message": "test",
                },
              },
            ],
            "collectionName": "posts",
            "doc": Object {
              "$set": Object {
                "title": "new title",
              },
            },
            "selector": Object {
              "id": "PostID",
            },
          }
    `);
      return Promise.resolve([]);
    },
  };

  const transaction = new AMTransaction(new Map());
  const operation = new AMUpdateOperation(transaction, {
    many: false,
    collectionName: 'posts',
    fieldsSelection: new AMFieldsSelectionContext(['_id', 'title']),
    data: new AMDataContext({ $set: { title: 'new title' } }),
    selector: new AMSelectorContext({ id: 'PostID' }),
  });
  operation.createArrayFilter().filter = { message: 'test' };

  return transaction.execute(adapter as DataSourceAdapter);
});

test('create many', () => {
  const adapter: Partial<DataSourceAdapter> = {
    insertMany(params) {
      expect(params).toMatchInlineSnapshot(`
          Object {
            "collectionName": "posts",
            "docs": Array [
              Object {
                "title": "new title",
              },
            ],
          }
      `);
      return Promise.resolve([]);
    },
  };

  const transaction = new AMTransaction(new Map());
  new AMCreateOperation(transaction, {
    many: true,
    collectionName: 'posts',
    dataList: new AMListValueContext([{ title: 'new title' }]),
  });

  return transaction.execute(adapter as DataSourceAdapter);
});

test('read dbref', async () => {
  const AdminId = new ObjectID();
  const CustomerId = new ObjectID();

  let n = 0;
  const adapter: Partial<DataSourceAdapter> = {
    findMany(params) {
      switch (n) {
        case 0: {
          expect(params).toMatchInlineSnapshot(`
          Object {
            "collectionName": "admins",
            "fields": Array [
              "_id",
              "title",
            ],
            "limit": undefined,
            "selector": Object {
              "_id": Object {
                "$in": Array [
                  "${AdminId}",
                ],
              },
            },
            "skip": undefined,
            "sort": undefined,
          }
        `);
          break;
        }
        case 1: {
          expect(params).toMatchInlineSnapshot(`
          Object {
            "collectionName": "customers",
            "fields": Array [
              "_id",
              "title",
            ],
            "limit": undefined,
            "selector": Object {
              "_id": Object {
                "$in": Array [
                  "${CustomerId}",
                ],
              },
            },
            "skip": undefined,
            "sort": undefined,
          }
        `);
          break;
        }
      }
      n++;
      return Promise.resolve([]);
    },
  };

  const transaction = new AMTransaction(new Map());
  new AMReadDBRefOperation(transaction, {
    many: true,
    fieldsSelection: new AMFieldsSelectionContext(['_id', 'title']),
    dbRefList: [
      new DBRef('admins', AdminId),
      new DBRef('customers', CustomerId),
    ],
  });

  return transaction.execute(adapter as DataSourceAdapter);
});

test('orderBy', () => {
  const adapter: Partial<DataSourceAdapter> = {
    findOne(params) {
      expect(params).toMatchInlineSnapshot(`
      Object {
        "collectionName": "posts",
        "fields": undefined,
        "selector": undefined,
      }
      `);
      return Promise.resolve([]);
    },
  };

  const transaction = new AMTransaction(new Map());
  new AMReadOperation(transaction, {
    many: false,
    collectionName: 'posts',
    orderBy: {
      _id: 1,
    },
  });

  return transaction.execute(adapter as DataSourceAdapter);
});
