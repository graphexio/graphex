"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _graphql = require("graphql");

var _lodash = _interopRequireDefault(require("lodash"));

var TypeWrap = function TypeWrap(_type) {
  var _this = this;

  (0, _classCallCheck2.default)(this, TypeWrap);
  (0, _defineProperty2.default)(this, "_type", null);
  (0, _defineProperty2.default)(this, "_realType", null);
  (0, _defineProperty2.default)(this, "_required", false);
  (0, _defineProperty2.default)(this, "_many", false);
  (0, _defineProperty2.default)(this, "_requiredArrayItem", false);
  (0, _defineProperty2.default)(this, "_nested", false);
  (0, _defineProperty2.default)(this, "_interface", false);
  (0, _defineProperty2.default)(this, "_inherited", null);
  (0, _defineProperty2.default)(this, "_updateNestedInterface", function (realType) {
    if (realType instanceof _graphql.GraphQLObjectType || realType instanceof _graphql.GraphQLInputObjectType) {
      _this._nested = true;
      _this._interface = false;
    } else if (realType instanceof _graphql.GraphQLInterfaceType) {
      _this._nested = true;
      _this._interface = true;
    } else {
      _this._nested = false;
      _this._interface = false;
    }
  });
  (0, _defineProperty2.default)(this, "realType", function () {
    return _this._realType;
  });
  (0, _defineProperty2.default)(this, "isRequired", function () {
    return _this._required;
  });
  (0, _defineProperty2.default)(this, "isMany", function () {
    return _this._many;
  });
  (0, _defineProperty2.default)(this, "isRequiredArrayItem", function () {
    return _this._requiredArrayItem;
  });
  (0, _defineProperty2.default)(this, "isNested", function () {
    return _this._nested;
  });
  (0, _defineProperty2.default)(this, "isInterface", function () {
    return _this._interface;
  });
  (0, _defineProperty2.default)(this, "isInherited", function () {
    return Boolean(_this._inherited);
  });
  (0, _defineProperty2.default)(this, "interfaceType", function () {
    return _this._inherited;
  });
  (0, _defineProperty2.default)(this, "clone", function () {
    return new TypeWrap(_this);
  });
  (0, _defineProperty2.default)(this, "type", function () {
    var type = _this._realType;

    if (_this._requiredArrayItem && _this._many) {
      type = new _graphql.GraphQLNonNull(type);
    }

    if (_this._many) {
      type = new _graphql.GraphQLList(type);
    }

    if (_this._required) {
      type = new _graphql.GraphQLNonNull(type);
    }

    return type;
  });
  (0, _defineProperty2.default)(this, "setRealType", function (realType) {
    _this._realType = realType;

    _this._updateNestedInterface(realType);

    return _this;
  });
  (0, _defineProperty2.default)(this, "setRequired", function (value) {
    _this._required = Boolean(value);
    return _this;
  });
  (0, _defineProperty2.default)(this, "setMany", function (value) {
    _this._many = Boolean(value);
    return _this;
  });
  (0, _defineProperty2.default)(this, "setRequiredArrayItem", function (value) {
    _this._requiredArrayItem = Boolean(value);
    return _this;
  });

  if (_type instanceof TypeWrap) {
    this._type = _type._type;
    this._realType = _type._realType;
    this._required = _type._required;
    this._many = _type._many;
    this._requiredArrayItem = _type._requiredArrayItem;
    this._nested = _type._nested;
    this._interface = _type._interface;
    this._inherited = _type._inherited;
    return;
  }

  this._type = _type;
  var _realType = _type; //required

  if (_realType instanceof _graphql.GraphQLNonNull) {
    this._required = true;
    _realType = _realType.ofType;
  } //array


  if (_realType instanceof _graphql.GraphQLList) {
    this._many = true;
    _realType = _realType.ofType;
  } //required array item


  if (_realType instanceof _graphql.GraphQLNonNull) {
    this._requiredArrayItem = true;
    _realType = _realType.ofType;
  } //object


  this._updateNestedInterface(_realType); //inherited


  if (_lodash.default.isArray(_realType._interfaces) && _realType._interfaces.length > 0) {
    this._inherited = _lodash.default.head(_realType._interfaces);
  }

  this._realType = _realType;
};

exports.default = TypeWrap;