import gql from 'graphql-tag';
import { defaultObjectFieldVisitorHandler } from '@apollo-model/core/lib/inputTypes/visitorHandlers';
import { AMGeoJSONCreateFieldFactory } from './create';
import { AMGeoJSONUpdateFieldFactory } from './update';
import { AMGeoJSONNearFieldFactory } from './whereNear';
import { AMGeoJSONWithinFieldFactory } from './whereWithin';
import { AMGeoJSONIntersectsFieldFactory } from './whereIntersects';
export * from './config';

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
