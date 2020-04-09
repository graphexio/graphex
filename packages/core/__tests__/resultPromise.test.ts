import { AMCreateOperation } from '../src/execution/operations/createOperation';
import {
  AMOperationResultPromise,
  AMDataResultPromise,
} from '../src/execution/resultPromise';
import { ResultPromiseTransforms } from '../src/execution/resultPromise';

import { AMTransaction } from '../src/execution/transaction';
import { ObjectID, DBRef } from 'mongodb';

describe('simple', () => {
  const arr = [{ test: 'value' }];
  const transaction = new AMTransaction();
  const operation = new AMCreateOperation(transaction, { collectionName: '' });
  const resultPromise = new AMOperationResultPromise<any>(operation);

  resultPromise.resolve(arr);

  test('simple', () => {
    expect(resultPromise.getValueSource()).toMatchInlineSnapshot(
      `"Operation-0"`
    );
    return expect(resultPromise).resolves.toEqual(arr);
  });

  test('data', () => {
    const dataPromise = new AMDataResultPromise({ data: 'test-value' });
    expect(dataPromise.getValueSource()).toEqual(`Static Data`);
  });

  test('distinct', () => {
    const result = ['value'];
    const distinctResultPromise = resultPromise.map(
      ResultPromiseTransforms.distinct('test')
    );
    expect(distinctResultPromise.getValueSource()).toEqual(
      `Operation-0 -> distinct('test')`
    );

    return expect(distinctResultPromise).resolves.toEqual(result);
  });

  test('distinctReplace', () => {
    const data = () => new AMDataResultPromise([{ _id: 'value' }]);
    const result = [{ test: { _id: 'value' } }];

    const distinctReplaceResultPromise = resultPromise.map(
      ResultPromiseTransforms.distinctReplace('test', '_id', data)
    );
    expect(distinctReplaceResultPromise.getValueSource()).toEqual(
      "Operation-0 -> distinctReplace('test', '_id', AMResultPromise { Static Data })"
    );

    return expect(distinctReplaceResultPromise).resolves.toEqual(result);
  });
});

describe('lookup', () => {
  test('lookup', () => {
    const arr = [{ id: 'item-id' }];
    const transaction = new AMTransaction();
    const operation = new AMCreateOperation(transaction, {
      collectionName: '',
    });
    const resultPromise = new AMOperationResultPromise<any>(operation);
    resultPromise.resolve(arr);

    const data = () =>
      new AMDataResultPromise([{ _id: 'child-id', parentId: 'item-id' }]);
    const result = [
      { id: 'item-id', children: [{ _id: 'child-id', parentId: 'item-id' }] },
    ];

    const lookupResultPromise = resultPromise.map(
      ResultPromiseTransforms.lookup('children', 'id', 'parentId', data)
    );
    expect(lookupResultPromise.getValueSource()).toEqual(
      "Operation-0 -> lookup('children', 'id', 'parentId', AMResultPromise { Static Data }, true)"
    );

    return expect(lookupResultPromise).resolves.toEqual(result);
  });

  test('lookup single', () => {
    const arr = [{ id: 'item-id' }];
    const transaction = new AMTransaction();
    const operation = new AMCreateOperation(transaction, {
      collectionName: '',
    });
    const resultPromise = new AMOperationResultPromise<any>(operation);
    resultPromise.resolve(arr);

    const data = () =>
      new AMDataResultPromise([{ _id: 'child-id', parentId: 'item-id' }]);
    const result = [
      { id: 'item-id', children: { _id: 'child-id', parentId: 'item-id' } },
    ];

    const lookupResultPromise = resultPromise.map(
      ResultPromiseTransforms.lookup('children', 'id', 'parentId', data, false)
    );
    expect(lookupResultPromise.getValueSource()).toEqual(
      "Operation-0 -> lookup('children', 'id', 'parentId', AMResultPromise { Static Data }, false)"
    );

    return expect(lookupResultPromise).resolves.toEqual(result);
  });

  test('lookup inside nested', () => {
    const arr = [{ id: 'item-id', nested: { id: 'nested-item-id' } }];
    const transaction = new AMTransaction();
    const operation = new AMCreateOperation(transaction, {
      collectionName: '',
    });
    const resultPromise = new AMOperationResultPromise<any>(operation);
    resultPromise.resolve(arr);

    const data = () =>
      new AMDataResultPromise([
        { _id: 'child-id', parentId: 'nested-item-id' },
      ]);
    const result = [
      {
        id: 'item-id',
        nested: {
          id: 'nested-item-id',
          children: { _id: 'child-id', parentId: 'nested-item-id' },
        },
      },
    ];

    const lookupResultPromise = resultPromise.map(
      ResultPromiseTransforms.lookup(
        'nested.children',
        'id',
        'parentId',
        data,
        false
      )
    );
    expect(lookupResultPromise.getValueSource()).toEqual(
      "Operation-0 -> lookup('nested.children', 'id', 'parentId', AMResultPromise { Static Data }, false)"
    );

    return expect(lookupResultPromise).resolves.toEqual(result);
  });
});

describe('dbRef', () => {
  const id1 = new ObjectID();
  const id2 = new ObjectID();
  const arr = { ids: [id1, id2], id: id1 };

  const transaction = new AMTransaction();
  const operation = new AMCreateOperation(transaction, { collectionName: '' });
  const resultPromise = new AMOperationResultPromise<any>(operation);
  resultPromise.resolve(arr);

  test('many', () => {
    const result = resultPromise
      .map(ResultPromiseTransforms.path('ids'))
      .map(ResultPromiseTransforms.dbRef('admins'));
    expect(result.getValueSource()).toEqual(
      "Operation-0 -> path('ids') -> dbRef('admins')"
    );

    return expect(result).resolves.toEqual([
      new DBRef('admins', id1),
      new DBRef('admins', id2),
    ]);
  });

  test('single', () => {
    const result = resultPromise
      .map(ResultPromiseTransforms.path('id'))
      .map(ResultPromiseTransforms.dbRef('admins'));
    expect(result.getValueSource()).toEqual(
      "Operation-0 -> path('id') -> dbRef('admins')"
    );

    return expect(result).resolves.toEqual(new DBRef('admins', id1));
  });
});

test('dbRef replace', () => {
  const id1 = new ObjectID();
  const id2 = new ObjectID();
  const id3 = new ObjectID();
  const collection1 = 'admins';
  const collection2 = 'customers';

  const obj1 = {
    _id: id1,
    mmCollectionName: collection1,
  };
  const obj2 = {
    _id: id2,
    mmCollectionName: collection1,
  };
  const obj3 = {
    _id: id3,
    mmCollectionName: collection2,
  };

  const doc = {
    ids: [
      new DBRef(collection1, id1),
      new DBRef(collection1, id2),
      new DBRef(collection2, id3),
    ],
  };

  const transaction = new AMTransaction();
  const operation = new AMCreateOperation(transaction, { collectionName: '' });
  const resultPromise = new AMOperationResultPromise<any>(operation);
  resultPromise.resolve(doc);

  const data = () =>
    new AMDataResultPromise({
      [collection1]: {
        [id1.toHexString()]: obj1,
        [id2.toHexString()]: obj2,
      },
      [collection2]: {
        [id3.toHexString()]: obj3,
      },
    });

  const result = resultPromise.map(
    ResultPromiseTransforms.dbRefReplace('ids', data)
  );

  expect(result.getValueSource()).toEqual(
    "Operation-0 -> dbRefReplace('ids', AMResultPromise { Static Data })"
  );

  return expect(result).resolves.toEqual({
    ids: [obj1, obj2, obj3],
  });
});

describe('transformArray', () => {
  const arr = [
    {
      comments: [
        { id: 1, message: 'message1' },
        { id: 2, message: 'message2' },
        { id: 3, message: 'message_test' },
        {
          id: 4,
          message: 'message_with_nested_arr',
          comments: [
            {
              id: 5,
              message: 'message_nested',
            },
          ],
        },
        {
          id: 6,
          message: 'message_with_tags1',
          tags: ['a'],
        },
        {
          id: 7,
          message: 'message_with_tags2',
          tags: ['a', 'b'],
        },
        {
          id: 8,
          message: 'message_with_tags2',
          tags: ['a', 'b', 'c'],
        },
      ],
    },
  ];
  const transaction = new AMTransaction();
  const operation = new AMCreateOperation(transaction, { collectionName: '' });
  const resultPromise = new AMOperationResultPromise<any>(operation);

  resultPromise.resolve(arr);

  test('string match', () => {
    const result = [
      {
        comments: [{ id: 3, message: 'message_test' }],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          message: 'message_test',
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });

  test('regex match', () => {
    const result = [
      {
        comments: [{ id: 3, message: 'message_test' }],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          message: {
            $regex: /test/,
          },
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });

  test('elemMatch', () => {
    const result = [
      {
        comments: [
          {
            id: 4,
            message: 'message_with_nested_arr',
            comments: [
              {
                id: 5,
                message: 'message_nested',
              },
            ],
          },
        ],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          comments: {
            $elemMatch: {
              message: 'message_nested',
            },
          },
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });

  test('all', () => {
    const result = [
      {
        comments: [
          {
            id: 7,
            message: 'message_with_tags2',
            tags: ['a', 'b'],
          },
          {
            id: 8,
            message: 'message_with_tags2',
            tags: ['a', 'b', 'c'],
          },
        ],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          tags: {
            $all: ['a', 'b'],
          },
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });

  test('exists', () => {
    const result = [
      {
        comments: [
          {
            id: 4,
            message: 'message_with_nested_arr',
            comments: [
              {
                id: 5,
                message: 'message_nested',
              },
            ],
          },
        ],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          comments: {
            $exists: true,
          },
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });

  test('gt', () => {
    const result = [
      {
        comments: [
          {
            id: 8,
            message: 'message_with_tags2',
            tags: ['a', 'b', 'c'],
          },
        ],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          id: {
            $gt: 7,
          },
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });
  test('gte', () => {
    const result = [
      {
        comments: [
          {
            id: 7,
            message: 'message_with_tags2',
            tags: ['a', 'b'],
          },
          {
            id: 8,
            message: 'message_with_tags2',
            tags: ['a', 'b', 'c'],
          },
        ],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          id: {
            $gte: 7,
          },
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });
  test('in for single', () => {
    const result = [
      {
        comments: [
          {
            id: 7,
            message: 'message_with_tags2',
            tags: ['a', 'b'],
          },
          {
            id: 8,
            message: 'message_with_tags2',
            tags: ['a', 'b', 'c'],
          },
        ],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          id: {
            $in: [7, 8],
          },
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });

  test('in for array', () => {
    const result = [
      {
        comments: [
          {
            id: 7,
            message: 'message_with_tags2',
            tags: ['a', 'b'],
          },
          {
            id: 8,
            message: 'message_with_tags2',
            tags: ['a', 'b', 'c'],
          },
        ],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          tags: {
            $in: ['b', 'c'],
          },
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });
  test('not', () => {
    const result = [
      {
        comments: [
          {
            id: 4,
            message: 'message_with_nested_arr',
            comments: [
              {
                id: 5,
                message: 'message_nested',
              },
            ],
          },
        ],
      },
    ];
    const transformResultPromise = resultPromise.map(
      ResultPromiseTransforms.transformArray('comments', {
        where: {
          comments: {
            $not: {
              $exists: false,
            },
          },
        },
      })
    );

    return expect(transformResultPromise).resolves.toEqual(result);
  });
});
