"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typeDef = exports.default = void 0;

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n  enum GeoJSONPointType {\n    Point\n  }\n  type GeoJSONPoint {\n    type: GeoJSONPointType\n    coordinates: [Float]\n    distance(toPoint: GeoJSONPointInput): Float\n  }\n  input GeoJSONPointInput {\n    type: GeoJSONPointType\n    coordinates: [Float]\n  }\n  input GeoJSONPointNearInput {\n    geometry: GeoJSONPointInput\n    maxDistance: Float\n    minDistance: Float\n  }\n\n  enum GeoJSONPolygonType {\n    Point\n  }\n  type GeoJSONPolygon {\n    type: GeoJSONPolygonType\n    coordinates: [[[Float]]]\n  }\n  input GeoJSONPolygonInput {\n    type: GeoJSONPolygonType\n    coordinates: [[[Float]]]\n  }\n\n  type _QueryMeta {\n    count: Int!\n  }\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var toRadians = function toRadians(num) {
  return num * Math.PI / 180;
};

var _default = {
  GeoJSONPoint: {
    distance: function distance(parent, args) {
      if (!args.toPoint) return NaN;
      var lat1 = parent.coordinates[1];
      var lon1 = parent.coordinates[0];
      var lat2 = args.toPoint.coordinates[1];
      var lon2 = args.toPoint.coordinates[0];
      var R = 6371e3; // metres

      var φ1 = toRadians(lat1);
      var φ2 = toRadians(lat2);
      var Δφ = toRadians(lat2 - lat1);
      var Δλ = toRadians(lon2 - lon1);
      var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return d;
    }
  }
};
exports.default = _default;
var typeDef = (0, _graphqlTag.default)(_templateObject());
exports.typeDef = typeDef;