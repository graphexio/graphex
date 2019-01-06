import gql from 'graphql-tag';

import InputTypes, {
  TRANSFORM_TO_INPUT,
  TRANSFORM_INPUT,
  INPUT_WHERE,
  INPUT_WHERE_UNIQUE,
  INPUT_CREATE,
  INPUT_UPDATE,
  INPUT_ORDER_BY,
  appendTransform,
  applyInputTransform,
} from './inputTypes';

const toRadians = num => {
  return (num * Math.PI) / 180;
};

export const resolvers = {
  GeoJSONPoint: {
    distance: (parent, args) => {
      if (!args.toPoint) return NaN;
      let lat1 = parent.coordinates[1];
      let lon1 = parent.coordinates[0];
      let lat2 = args.toPoint.coordinates[1];
      let lon2 = args.toPoint.coordinates[0];

      var R = 6371e3; // metres
      var φ1 = toRadians(lat1);
      var φ2 = toRadians(lat2);
      var Δφ = toRadians(lat2 - lat1);
      var Δλ = toRadians(lon2 - lon1);

      var a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      var d = R * c;
      return d;
    },
  },
};

export const typeDef = gql`
  enum GeoJSONPointType {
    Point
  }
  type GeoJSONPoint {
    type: GeoJSONPointType!
    coordinates: [Float!]!
    distance(toPoint: GeoJSONPointInput): Float
  }
  input GeoJSONPointInput {
    type: GeoJSONPointType!
    coordinates: [Float!]!
  }
  input GeoJSONPointNearInput {
    geometry: GeoJSONPointInput!
    maxDistance: Float
    minDistance: Float
  }

  # enum GeoJSONPolygonType {
  #   Polygon
  # }
  # type GeoJSONPolygon {
  #   type: GeoJSONPolygonType
  #   coordinates: [[[Float]]]
  # }
  # input GeoJSONPolygonInput {
  #   type: GeoJSONPolygonType
  #   coordinates: [[[Float]]]
  # }
`;

function initGeoJSONPoint(field, { types }) {
  appendTransform(field, TRANSFORM_TO_INPUT, {
    [INPUT_ORDER_BY]: field => [],
    [INPUT_CREATE]: field => [
      {
        name: field.name,
        type: types.GeoJSONPointInput,
        mmTransform: params => params,
      },
    ],
    [INPUT_UPDATE]: field => [
      {
        name: field.name,
        type: types.GeoJSONPointInput,
        mmTransform: params => params,
      },
    ],
    [INPUT_WHERE]: field => [
      {
        name: `${field.name}_near`,
        type: types.GeoJSONPointNearInput,
        mmTransform: params => {
          let value = params[`${field.name}_near`];
          params = {
            [field.name]: {
              $near: {
                $geometry: value.geometry,
                ...(value.minDistance
                  ? { $minDistance: value.minDistance }
                  : null),
                ...(value.maxDistance
                  ? { $maxDistance: value.maxDistance }
                  : null),
              },
            },
          };
          if (field[TRANSFORM_INPUT] && field[TRANSFORM_INPUT][INPUT_WHERE]) {
            params = field[TRANSFORM_INPUT][INPUT_WHERE](params);
          }
          return params;
        },
      },
    ],
  });
}

export const fieldsInit = {
  GeoJSONPoint: initGeoJSONPoint,
};
