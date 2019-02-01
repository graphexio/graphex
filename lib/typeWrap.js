"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _graphql = require("graphql");

var _lodash = _interopRequireDefault(require("lodash"));

class TypeWrap {
  constructor(_type) {
    (0, _defineProperty2.default)(this, "_type", null);
    (0, _defineProperty2.default)(this, "_realType", null);
    (0, _defineProperty2.default)(this, "_required", false);
    (0, _defineProperty2.default)(this, "_many", false);
    (0, _defineProperty2.default)(this, "_requiredArrayItem", false);
    (0, _defineProperty2.default)(this, "_nested", false);
    (0, _defineProperty2.default)(this, "_interface", false);
    (0, _defineProperty2.default)(this, "_inherited", null);
    (0, _defineProperty2.default)(this, "_updateNestedInterface", realType => {
      if (realType instanceof _graphql.GraphQLObjectType || realType instanceof _graphql.GraphQLInputObjectType) {
        this._nested = true;
        this._interface = false;
      } else if (realType instanceof _graphql.GraphQLInterfaceType) {
        this._nested = true;
        this._interface = true;
      } else {
        this._nested = false;
        this._interface = false;
      }
    });
    (0, _defineProperty2.default)(this, "realType", () => this._realType);
    (0, _defineProperty2.default)(this, "isRequired", () => this._required);
    (0, _defineProperty2.default)(this, "isMany", () => this._many);
    (0, _defineProperty2.default)(this, "isRequiredArrayItem", () => this._requiredArrayItem);
    (0, _defineProperty2.default)(this, "isNested", () => this._nested);
    (0, _defineProperty2.default)(this, "isInterface", () => this._interface);
    (0, _defineProperty2.default)(this, "isInherited", () => Boolean(this._inherited));
    (0, _defineProperty2.default)(this, "interfaceType", () => this._inherited);
    (0, _defineProperty2.default)(this, "clone", () => {
      return new TypeWrap(this);
    });
    (0, _defineProperty2.default)(this, "type", () => {
      let type = this._realType;

      if (this._requiredArrayItem && this._many) {
        type = new _graphql.GraphQLNonNull(type);
      }

      if (this._many) {
        type = new _graphql.GraphQLList(type);
      }

      if (this._required) {
        type = new _graphql.GraphQLNonNull(type);
      }

      return type;
    });
    (0, _defineProperty2.default)(this, "setRealType", realType => {
      this._realType = realType;

      this._updateNestedInterface(realType);

      return this;
    });
    (0, _defineProperty2.default)(this, "setRequired", value => {
      this._required = Boolean(value);
      return this;
    });
    (0, _defineProperty2.default)(this, "setMany", value => {
      this._many = Boolean(value);
      return this;
    });
    (0, _defineProperty2.default)(this, "setRequiredArrayItem", value => {
      this._requiredArrayItem = Boolean(value);
      return this;
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
    let _realType = _type; //required

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
  }

}

exports.default = TypeWrap;