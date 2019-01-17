"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fieldsInit = exports.typeDef = exports.resolvers = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _utils = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n  enum GeoJSONPointType {\n    Point\n  }\n  type GeoJSONPoint {\n    type: GeoJSONPointType!\n    coordinates: [Float!]!\n    distance(toPoint: GeoJSONPointInput): Float\n  }\n  input GeoJSONPointInput {\n    type: GeoJSONPointType!\n    coordinates: [Float!]!\n  }\n  input GeoJSONPointNearInput {\n    geometry: GeoJSONPointInput!\n    maxDistance: Float\n    minDistance: Float\n  }\n\n  # enum GeoJSONPolygonType {\n  #   Polygon\n  # }\n  # type GeoJSONPolygon {\n  #   type: GeoJSONPolygonType\n  #   coordinates: [[[Float]]]\n  # }\n  # input GeoJSONPolygonInput {\n  #   type: GeoJSONPolygonType\n  #   coordinates: [[[Float]]]\n  # }\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var toRadians = function toRadians(num) {
  return num * Math.PI / 180;
};

var resolvers = {
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
exports.resolvers = resolvers;
var typeDef = (0, _graphqlTag.default)(_templateObject());
exports.typeDef = typeDef;

function initGeoJSONPoint(_ref) {
  var _appendTransform;

  var field = _ref.field,
      inputTypes = _ref.inputTypes;
  (0, _utils.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, (_appendTransform = {}, (0, _defineProperty2.default)(_appendTransform, KIND.ORDER_BY, function (_ref2) {
    var field = _ref2.field;
    return [];
  }), (0, _defineProperty2.default)(_appendTransform, KIND.CREATE, function (_ref3) {
    var field = _ref3.field;
    return [{
      name: field.name,
      type: inputTypes.exist('GeoJSONPointInput'),
      mmTransform: function mmTransform(params) {
        return params;
      }
    }];
  }), (0, _defineProperty2.default)(_appendTransform, KIND.UPDATE, function (_ref4) {
    var field = _ref4.field;
    return [{
      name: field.name,
      type: inputTypes.exist('GeoJSONPointInput'),
      mmTransform: function mmTransform(params) {
        return params;
      }
    }];
  }), (0, _defineProperty2.default)(_appendTransform, KIND.WHERE, function (_ref5) {
    var field = _ref5.field;
    return [{
      name: "".concat(field.name, "_near"),
      type: inputTypes.exist('GeoJSONPointNearInput'),
      mmTransform: function mmTransform(params) {
        var value = params["".concat(field.name, "_near")];
        params = (0, _defineProperty2.default)({}, field.name, {
          $near: (0, _objectSpread2.default)({
            $geometry: value.geometry
          }, value.minDistance ? {
            $minDistance: value.minDistance
          } : null, value.maxDistance ? {
            $maxDistance: value.maxDistance
          } : null)
        });

        if (field[HANDLER.TRANSFORM_INPUT] && field[HANDLER.TRANSFORM_INPUT][KIND.WHERE]) {
          params = field[HANDLER.TRANSFORM_INPUT][KIND.WHERE](params);
        }

        return params;
      }
    }];
  }), _appendTransform));
}

var fieldsInit = {
  GeoJSONPoint: initGeoJSONPoint
};
exports.fieldsInit = fieldsInit;