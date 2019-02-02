import gql from 'graphql-tag';

import {appendTransform} from '../inputTypes/utils';
import * as HANDLER from '../inputTypes/handlers';
import * as KIND from '../inputTypes/kinds';

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
      
      let R = 6371e3; // metres
      let φ1 = toRadians(lat1);
      let φ2 = toRadians(lat2);
      let Δφ = toRadians(lat2 - lat1);
      let Δλ = toRadians(lon2 - lon1);
      
      let a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
      let d = R * c;
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

function initGeoJSONPoint({field, inputTypes}) {
  appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
    [KIND.ORDER_BY]: ({field}) => [],
    [KIND.CREATE]: ({field}) => [
      {
        name: field.name,
        mmDatabaseName: field.mmDatabaseName,
        type: inputTypes.exist('GeoJSONPointInput'),
        mmTransform: params => params,
      },
    ],
    [KIND.UPDATE]: ({field}) => [
      {
        name: field.name,
        mmDatabaseName: field.mmDatabaseName,
        type: inputTypes.exist('GeoJSONPointInput'),
        mmTransform: params => params,
      },
    ],
    [KIND.WHERE]: ({field}) => [
      {
        name: `${field.name}_near`,
        type: inputTypes.exist('GeoJSONPointNearInput'),
        mmTransform: params => {
          let value = params[`${field.name}_near`];
          params = {
            [field.name]: {
              $near: {
                $geometry: value.geometry,
                ...(value.minDistance
                  ? {$minDistance: value.minDistance}
                  : null),
                ...(value.maxDistance
                  ? {$maxDistance: value.maxDistance}
                  : null),
              },
            },
          };
          if (
            field[HANDLER.TRANSFORM_INPUT] &&
            field[HANDLER.TRANSFORM_INPUT][KIND.WHERE]
          ) {
            params = field[HANDLER.TRANSFORM_INPUT][KIND.WHERE](params);
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
