import gql from 'graphql-tag';

const toRadians = num => {
  return (num * Math.PI) / 180;
};

export default {
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
    type: GeoJSONPointType
    coordinates: [Float]
    distance(toPoint: GeoJSONPointInput): Float
  }
  input GeoJSONPointInput {
    type: GeoJSONPointType
    coordinates: [Float]
  }
  input GeoJSONPointNearInput {
    geometry: GeoJSONPointInput
    maxDistance: Float
    minDistance: Float
  }

  enum GeoJSONPolygonType {
    Point
  }
  type GeoJSONPolygon {
    type: GeoJSONPolygonType
    coordinates: [[[Float]]]
  }
  input GeoJSONPolygonInput {
    type: GeoJSONPolygonType
    coordinates: [[[Float]]]
  }

  type _QueryMeta {
    count: Int!
  }
`;
