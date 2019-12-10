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
          }
        }
      `,
      variables: { coordinates },
    });
    expect(errors).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
        Object {
          "createPoi": Object {
            "title": "poi ${coordsStr}",
          },
        }
    `);
  });
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

beforeAll(async () => {
  let DB = await connectToDatabase();
  DB.collection('pois').createIndex({ place: '2dsphere' });
});

afterAll(async () => {
  //   mongod.stop();
});
