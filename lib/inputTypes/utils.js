"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyInputTransform = applyInputTransform;
exports.appendTransform = appendTransform;
exports.reduceTransforms = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _graphql = require("graphql");

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("../utils");

var reduceTransforms = function reduceTransforms(arr) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(params) {
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return (0, _utils.asyncForEach)(arr,
                /*#__PURE__*/
                function () {
                  var _ref2 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee(func) {
                    return _regenerator.default.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            if (!func) {
                              _context.next = 4;
                              break;
                            }

                            _context.next = 3;
                            return func(params);

                          case 3:
                            params = _context.sent;

                          case 4:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee, this);
                  }));

                  return function (_x2) {
                    return _ref2.apply(this, arguments);
                  };
                }());

              case 2:
                return _context2.abrupt("return", params);

              case 3:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }()
  );
};

exports.reduceTransforms = reduceTransforms;

function applyInputTransform(_x3, _x4) {
  return _applyInputTransform.apply(this, arguments);
}

function _applyInputTransform() {
  _applyInputTransform = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(value, type) {
    var fields, result;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!(type instanceof _graphql.GraphQLList)) {
              _context4.next = 6;
              break;
            }

            _context4.next = 3;
            return Promise.all(value.map(function (val) {
              return applyInputTransform(val, type.ofType);
            }));

          case 3:
            return _context4.abrupt("return", _context4.sent);

          case 6:
            if (!(type instanceof _graphql.GraphQLNonNull)) {
              _context4.next = 8;
              break;
            }

            return _context4.abrupt("return", applyInputTransform(value, type.ofType));

          case 8:
            fields = type._fields;

            if (fields) {
              _context4.next = 11;
              break;
            }

            return _context4.abrupt("return", value);

          case 11:
            result = {};
            _context4.next = 14;
            return (0, _utils.asyncForEach)(_lodash.default.keys(value),
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee3(key) {
                var field, val;
                return _regenerator.default.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        field = fields[key];
                        val = value[key];
                        _context3.t0 = _objectSpread2.default;
                        _context3.t1 = {};
                        _context3.t2 = result;

                        if (!field.mmTransform) {
                          _context3.next = 11;
                          break;
                        }

                        _context3.next = 8;
                        return field.mmTransform((0, _defineProperty2.default)({}, key, val));

                      case 8:
                        _context3.t3 = _context3.sent;
                        _context3.next = 18;
                        break;

                      case 11:
                        _context3.t4 = _defineProperty2.default;
                        _context3.t5 = {};
                        _context3.t6 = key;
                        _context3.next = 16;
                        return applyInputTransform(val, field.type);

                      case 16:
                        _context3.t7 = _context3.sent;
                        _context3.t3 = (0, _context3.t4)(_context3.t5, _context3.t6, _context3.t7);

                      case 18:
                        _context3.t8 = _context3.t3;
                        result = (0, _context3.t0)(_context3.t1, _context3.t2, _context3.t8);

                      case 20:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, this);
              }));

              return function (_x5) {
                return _ref3.apply(this, arguments);
              };
            }());

          case 14:
            return _context4.abrupt("return", result);

          case 15:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));
  return _applyInputTransform.apply(this, arguments);
}

function appendTransform(field, handler, functions) {
  if (!field[handler]) field[handler] = {};
  field[handler] = (0, _objectSpread2.default)({}, field[handler], functions);
}