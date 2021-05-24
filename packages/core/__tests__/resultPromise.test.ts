import { AMCreateOperation } from '../src/execution/operations/createOperation';
import {
  AMOperationResultPromise,
  AMDataResultPromise,
} from '../src/execution/resultPromise';
import { ResultPromiseTransforms } from '../src/execution/resultPromise';

import { AMTransaction } from '../src/execution/transaction';
import { ObjectID, DBRef } from 'mongodb';
import Serializer from '../src/serializer';
import { AMOperation } from '../src/execution/operation';
import { AMModelType } from '../src/definitions';
import { Path } from '../src/execution/path';

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

  test('indexBy', () => {
    const result = { value: { test: 'value' } };
    const indexByResultPromise = resultPromise.map(
      new ResultPromiseTransforms.IndexBy({ groupingField: 'test' })
    );
    expect(indexByResultPromise.getValueSource()).toMatchInlineSnapshot(`
      Array [
        "Operation-0",
        IndexBy {
          "params": Object {
            "groupingField": "test",
          },
        },
      ]
    `);

    return expect(indexByResultPromise).resolves.toEqual(result);
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
});

describe('dbRef', () => {
  const id1 = new ObjectID();
  const id2 = new ObjectID();
  const arr = { ids: [id1, id2], id: id1 };

  const transaction = new AMTransaction(new Map());
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
  const transaction = new AMTransaction(new Map());
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
      new ResultPromiseTransforms.TransformArray([], 'comments', 'comments', {
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
