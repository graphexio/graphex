import { defaultObjectFieldVisitorHandler } from '@apollo-model/core/lib/inputTypes/visitorHandlers';
import gql from 'graphql-tag';
export * from './config';

const toRadians = num => {
  return (num * Math.PI) / 180;
};

export const resolvers = {
  GeoJSONPoint: {
    distance: (parent, args) => {
      if (!args.toPoint) return NaN;
      const lat1 = parent.coordinates[1];
      const lon1 = parent.coordinates[0];
      const lat2 = args.toPoint.coordinates[1];
      const lon2 = args.toPoint.coordinates[0];

      const R = 6371e3; // metres
      const φ1 = toRadians(lat1);
      const φ2 = toRadians(lat2);
      const Δφ = toRadians(lat2 - lat1);
      const Δλ = toRadians(lon2 - lon1);

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const d = R * c;
      return d;
    },
  },
};

export const typeDef = gql`
  #Point
  enum GeoJSONPointType {
    Point
  }
  type GeoJSONPoint @embedded {
    type: GeoJSONPointType!
    coordinates: [Float!]!
    distance(toPoint: GeoJSONPointInput): Float
  }
  input GeoJSONPointInput {
    type: GeoJSONPointType!
    coordinates: [Float!]!
  }

  #Polygon
  enum GeoJSONPolygonType {
    Polygon
  }
  type GeoJSONPolygon @embedded {
    type: GeoJSONPolygonType
    coordinates: [[[Float]]]
  }
  input GeoJSONPolygonInput {
    type: GeoJSONPolygonType
    coordinates: [[[Float]]]
  }

  #Where
  input GeoJSONPointNearInput {
    geometry: GeoJSONPointInput!
    maxDistance: Float
    minDistance: Float
  }

  input GeoJSONPointWithinInput {
    geometry: GeoJSONPolygonInput!
  }

  input GeoJSONIntersectsInput {
    point: GeoJSONPointInput
    polygon: GeoJSONPolygonInput
  }
`;

// export const fieldFactoriesMap = {
//   GeoJSONPoint: {
//     AMCreateTypeFactory: [AMGeoJSONCreateFieldFactory],
//     AMUpdateTypeFactory: [AMGeoJSONUpdateFieldFactory],
//     AMWhereTypeFactory: [
//       AMGeoJSONNearFieldFactory,
//       AMGeoJSONWithinFieldFactory,
//       AMGeoJSONIntersectsFieldFactory,
//     ],
//   },
//   GeoJSONPolygon: {
//     AMCreateTypeFactory: [AMGeoJSONCreateFieldFactory],
//     AMUpdateTypeFactory: [AMGeoJSONUpdateFieldFactory],
//     AMWhereTypeFactory: [
//       AMGeoJSONNearFieldFactory,
//       AMGeoJSONWithinFieldFactory,
//       AMGeoJSONIntersectsFieldFactory,
//     ],
//   },
// };

export const fieldVisitorEventsMap = {
  GeoJSONPointNearInput: {
    geometry: defaultObjectFieldVisitorHandler('geometry'),
    maxDistance: defaultObjectFieldVisitorHandler('maxDistance'),
    minDistance: defaultObjectFieldVisitorHandler('minDistance'),
  },
  GeoJSONPointWithinInput: {
    geometry: defaultObjectFieldVisitorHandler('geometry'),
  },
  GeoJSONPointInput: {
    type: defaultObjectFieldVisitorHandler('type'),
    coordinates: defaultObjectFieldVisitorHandler('coordinates'),
  },
  GeoJSONPolygonInput: {
    type: defaultObjectFieldVisitorHandler('type'),
    coordinates: defaultObjectFieldVisitorHandler('coordinates'),
  },
  GeoJSONIntersectsInput: {
    point: defaultObjectFieldVisitorHandler('point'),
    polygon: defaultObjectFieldVisitorHandler('polygon'),
  },
};
