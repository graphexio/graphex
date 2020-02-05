jest.setTimeout(20000);

const {
  query,
  mutate,
  mongod,
  connectToDatabase,
} = require('./integration-prepare');
const _ = require('lodash');
import gql from 'graphql-tag';

jest.setTimeout(10000);

beforeAll(async () => {
  let DB = await connectToDatabase();
  DB.collection('pois').createIndex({ place: '2dsphere' });
  DB.collection('area').createIndex({ place: '2dsphere' });
});

afterAll(async () => {
  //   mongod.stop();
});

test('Poi create', async () => {
  [
    [0, 0],
    [0, 50],
    [50, 50],
    [50, 0],
  ].forEach(async coordinates => {
    let coordsStr = coordinates.join(',');
    let { errors, data } = await mutate({
      mutation: gql`
        mutation {
          createPoi(
            data: {
              title: "poi ${coordsStr}"
              place: { type: Point, coordinates: [${coordsStr}] }
            }
          ) {
            title
            place{
              type
              coordinates
            }
          }
        }
      `,
      variables: { coordinates },
    });
    expect(errors).toBeUndefined();
    expect(data).toEqual({
      createPoi: {
        place: {
          coordinates: [coordinates[0], coordinates[1]],
          type: 'Point',
        },
        title: `poi ${coordsStr}`,
      },
    });
  });
});

test('Create Poi with area', async () => {
  let { errors, data } = await mutate({
    mutation: gql`
      mutation {
        createPoi(
          data: {
            title: "poi with area"
            area: {
              type: Polygon
              coordinates: [[[0, 0], [0, 50], [50, 50], [50, 0], [0, 0]]]
            }
          }
        ) {
          title
          area {
            type
            coordinates
          }
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "createPoi": Object {
        "area": Object {
          "coordinates": Array [
            Array [
              Array [
                0,
                0,
              ],
              Array [
                0,
                50,
              ],
              Array [
                50,
                50,
              ],
              Array [
                50,
                0,
              ],
              Array [
                0,
                0,
              ],
            ],
          ],
          "type": "Polygon",
        },
        "title": "poi with area",
      },
    }
    `);
});

test('Update Poi with area', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        pois {
          id
        }
      }
    `,
    variables: {},
  });
  const poiId = data.pois[0].id;

  {
    let { errors, data } = await mutate({
      mutation: gql`
        mutation($poiId: ObjectID!) {
          updatePoi(
            where: { id: $poiId }
            data: { area: { type: Polygon, coordinates: [[[0, 0], [0, 50]]] } }
          ) {
            area {
              type
              coordinates
            }
          }
        }
      `,
      variables: { poiId },
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
        Object {
          "updatePoi": Object {
            "area": Object {
              "coordinates": Array [
                Array [
                  Array [
                    0,
                    0,
                  ],
                  Array [
                    0,
                    50,
                  ],
                ],
              ],
              "type": "Polygon",
            },
          },
        }
    `);
  }
});

test('Near', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        pois(
          where: {
            place_near: {
              geometry: { type: Point, coordinates: [0, 51] }
              maxDistance: 5000000
            }
          }
        ) {
          title
        }
      }
    `,
    variables: {},
  });
  expect(errors).toBeUndefined();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "pois": Array [
        Object {
          "title": "poi 0,50",
        },
        Object {
          "title": "poi 50,50",
        },
      ],
    }
  `);
});

test('Within', async () => {
  {
    let { errors, data } = await query({
      query: gql`
        query {
          pois(
            where: {
              place_within: {
                geometry: {
                  type: Polygon
                  coordinates: [
                    [[49, 51], [51, 51], [51, 49], [49, 49], [49, 51]]
                  ]
                }
              }
            }
          ) {
            title
          }
        }
      `,
      variables: {},
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
      Object {
        "pois": Array [
          Object {
            "title": "poi 50,50",
          },
        ],
      }
    `);
  }
  {
    let { errors, data } = await query({
      query: gql`
        query {
          pois(
            where: {
              place_within: {
                geometry: {
                  type: Polygon
                  coordinates: [[[-1, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]]]
                }
              }
            }
          ) {
            title
          }
        }
      `,
      variables: {},
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
          Object {
            "pois": Array [
              Object {
                "title": "poi 0,0",
              },
            ],
          }
        `);
  }
});

test('Intersects', async () => {
  {
    let { errors, data } = await query({
      query: gql`
        query {
          pois(
            where: {
              area_intersects: { point: { type: Point, coordinates: [25, 25] } }
            }
          ) {
            title
          }
        }
      `,
      variables: {},
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
    Object {
      "pois": Array [
        Object {
          "title": "poi with area",
        },
      ],
    }
    `);
  }
  {
    let { errors, data } = await query({
      query: gql`
        query {
          pois(
            where: {
              area_intersects: { point: { type: Point, coordinates: [55, 25] } }
            }
          ) {
            title
          }
        }
      `,
      variables: {},
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
    Object {
      "pois": Array [],
    }
    `);
  }
});

test('Intersects input error', async () => {
  let { errors, data } = await query({
    query: gql`
      query {
        pois(
          where: {
            area_intersects: {
              point: { type: Point, coordinates: [25, 25] }
              polygon: { type: Polygon, coordinates: [[[25, 25]]] }
            }
          }
        ) {
          title
        }
      }
    `,
    variables: {},
  });
  expect(errors).toMatchInlineSnapshot(`
    Array [
      Object {
        "extensions": Object {
          "code": "BAD_USER_INPUT",
        },
        "locations": Array [
          Object {
            "column": 3,
            "line": 2,
          },
        ],
        "message": "You should fill only one field",
        "path": Array [
          "pois",
        ],
      },
    ]
    `);
});
