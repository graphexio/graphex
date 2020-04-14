import { AMCreateOperation } from '../src/execution/operations/createOperation';
import {
  AMOperationResultPromise,
  AMDataResultPromise,
} from '../src/execution/resultPromise';
import { ResultPromiseTransforms } from '../src/execution/resultPromise';

import { AMTransaction } from '../src/execution/transaction';
import { ObjectID, DBRef } from 'mongodb';
import Serializer from './serializer';
import { AMOperation } from '../src/execution/operation';

expect.addSnapshotSerializer(Serializer);

describe('simple', () => {
  const arr = [{ test: 'value' }];
  const transaction = new AMTransaction();
  const operation = new AMCreateOperation(transaction, { collectionName: '' });
  const resultPromise = new AMOperationResultPromise<any>(operation);

  resultPromise.resolve(arr);

  test('simple', () => {
    expect(resultPromise.getValueSource()).toMatchInlineSnapshot(`
      Array [
        "Operation-0",
      ]
    `);
    return expect(resultPromise).resolves.toEqual(arr);
  });

  test('data', () => {
    const dataPromise = new AMDataResultPromise({ data: 'test-value' });
    expect(dataPromise.getValueSource()).toMatchInlineSnapshot(`
      Array [
        "Static Data",
      ]
    `);
  });

  test('distinct', () => {
    const result = ['value'];
    const distinctResultPromise = resultPromise.map(
      new ResultPromiseTransforms.Distinct('test')
    );
    expect(distinctResultPromise.getValueSource()).toMatchInlineSnapshot(`
      Array [
        "Operation-0",
        Distinct {
          "path": "test",
        },
      ]
    `);

    return expect(distinctResultPromise).resolves.toEqual(result);
  });

  test('distinctReplace', () => {
    const data = ({
      getOutput() {
        return new AMDataResultPromise([{ _id: 'value' }]);
      },
    } as any) as AMOperation;
    const result = [{ test: 'value', testAlias: { _id: 'value' } }];

    const distinctReplaceResultPromise = resultPromise.map(
      new ResultPromiseTransforms.DistinctReplace(
        [],
        'testAlias',
        'test',
        '_id',
        data
      ).addCondition(new Map())
    );
    expect(distinctReplaceResultPromise.getValueSource())
      .toMatchInlineSnapshot(`
Array [
  "Operation-0",
  DistinctReplace {
    "conditions": Array [
      Map {},
    ],
    "data": ResultPromise {
      "source": Array [
        "Static Data",
      ],
    },
    "displayField": "testAlias",
    "path": Array [],
    "relationField": "_id",
    "storeField": "test",
  },
]
`);

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

    const data = ({
      getOutput() {
        return new AMDataResultPromise([
          { _id: 'child-id', parentId: 'item-id' },
        ]);
      },
    } as any) as AMOperation;
    const result = [
      { id: 'item-id', children: [{ _id: 'child-id', parentId: 'item-id' }] },
    ];

    const lookupResultPromise = resultPromise.map(
      new ResultPromiseTransforms.Lookup(
        'children',
        'id',
        'parentId',
        data
      ).addCondition(new Map())
    );
    expect(lookupResultPromise.getValueSource()).toMatchInlineSnapshot(`
Array [
  "Operation-0",
  Lookup {
    "conditions": Array [
      Map {},
    ],
    "data": ResultPromise {
      "source": Array [
        "Static Data",
      ],
    },
    "many": true,
    "path": "children",
    "relationField": "id",
    "storeField": "parentId",
  },
]
`);

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

    const data = ({
      getOutput() {
        return new AMDataResultPromise([
          { _id: 'child-id', parentId: 'item-id' },
        ]);
      },
    } as any) as AMOperation;
    const result = [
      { id: 'item-id', children: { _id: 'child-id', parentId: 'item-id' } },
    ];

    const lookupResultPromise = resultPromise.map(
      new ResultPromiseTransforms.Lookup(
        'children',
        'id',
        'parentId',
        data,
        false
      ).addCondition(new Map())
    );
    expect(lookupResultPromise.getValueSource()).toMatchInlineSnapshot(`
Array [
  "Operation-0",
  Lookup {
    "conditions": Array [
      Map {},
    ],
    "data": ResultPromise {
      "source": Array [
        "Static Data",
      ],
    },
    "many": false,
    "path": "children",
    "relationField": "id",
    "storeField": "parentId",
  },
]
`);

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

    const data = ({
      getOutput() {
        return new AMDataResultPromise([
          { _id: 'child-id', parentId: 'nested-item-id' },
        ]);
      },
    } as any) as AMOperation;
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
      new ResultPromiseTransforms.Lookup(
        'nested.children',
        'id',
        'parentId',
        data,
        false
      ).addCondition(new Map())
    );
    expect(lookupResultPromise.getValueSource()).toMatchInlineSnapshot(`
Array [
  "Operation-0",
  Lookup {
    "conditions": Array [
      Map {},
    ],
    "data": ResultPromise {
      "source": Array [
        "Static Data",
      ],
    },
    "many": false,
    "path": "nested.children",
    "relationField": "id",
    "storeField": "parentId",
  },
]
`);

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
      .map(new ResultPromiseTransforms.Path('ids'))
      .map(new ResultPromiseTransforms.ToDbRef('admins'));
    expect(result.getValueSource()).toMatchInlineSnapshot(
      `
      Array [
        "Operation-0",
        Path {
          "path": "ids",
        },
        ToDbRef {
          "collectionName": "admins",
        },
      ]
    `
    );

    return expect(result).resolves.toEqual([
      new DBRef('admins', id1),
      new DBRef('admins', id2),
    ]);
  });

  test('single', () => {
    const result = resultPromise
      .map(new ResultPromiseTransforms.Path('id'))
      .map(new ResultPromiseTransforms.ToDbRef('admins'));
    expect(result.getValueSource()).toMatchInlineSnapshot(
      `
      Array [
        "Operation-0",
        Path {
          "path": "id",
        },
        ToDbRef {
          "collectionName": "admins",
        },
      ]
    `
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

  const data = ({
    getOutput() {
      return new AMDataResultPromise({
        [collection1]: {
          [id1.toHexString()]: obj1,
          [id2.toHexString()]: obj2,
        },
        [collection2]: {
          [id3.toHexString()]: obj3,
        },
      });
    },
  } as any) as AMOperation;

  const result = resultPromise.map(
    new ResultPromiseTransforms.DbRefReplace(
      [],
      'ids',
      'ids',
      data
    ).addCondition(new Map())
  );

  expect(result.getValueSource()).toMatchInlineSnapshot(`
Array [
  "Operation-0",
  DbRefReplace {
    "conditions": Array [
      Map {},
    ],
    "data": ResultPromise {
      "source": Array [
        "Static Data",
      ],
    },
    "displayField": "ids",
    "path": Array [],
    "storeField": "ids",
  },
]
`);

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
      new ResultPromiseTransforms.TransformArray('comments', {
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
      new ResultPromiseTransforms.TransformArray('comments', {
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
      new ResultPromiseTransforms.TransformArray('comments', {
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
      new ResultPromiseTransforms.TransformArray('comments', {
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
      new ResultPromiseTransforms.TransformArray('comments', {
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
      new ResultPromiseTransforms.TransformArray('comments', {
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
      new ResultPromiseTransforms.TransformArray('comments', {
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
      new ResultPromiseTransforms.TransformArray('comments', {
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
      new ResultPromiseTransforms.TransformArray('comments', {
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
      new ResultPromiseTransforms.TransformArray('comments', {
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
