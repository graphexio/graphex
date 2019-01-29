"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appendTransform = appendTransform;
exports.applyInputTransform = exports.applyAlwaysInputTransform = exports.reduceTransforms = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

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
      _regenerator.default.mark(function _callee2(params, context) {
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
                            return func(params, context);

                          case 3:
                            params = _context.sent;

                          case 4:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee, this);
                  }));

                  return function (_x3) {
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

      return function (_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }()
  );
};

exports.reduceTransforms = reduceTransforms;

var applyAlwaysInputTransform = function applyAlwaysInputTransform(context) {
  return (
    /*#__PURE__*/
    function () {
      var _ref3 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(modelType, args, kind) {
        var data;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                data = (0, _objectSpread2.default)({}, args);
                _context4.next = 3;
                return (0, _utils.asyncForEach)(Object.entries(modelType._fields),
                /*#__PURE__*/
                function () {
                  var _ref5 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee3(_ref4) {
                    var _ref6, fieldName, field, transform;

                    return _regenerator.default.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            _ref6 = (0, _slicedToArray2.default)(_ref4, 2), fieldName = _ref6[0], field = _ref6[1];

                            if (!(field.mmTransformAlways && field.mmTransformAlways.includes(kind))) {
                              _context3.next = 11;
                              break;
                            }

                            if (!(field.mmTransformInput || field.mmTransformInput[kind])) {
                              _context3.next = 11;
                              break;
                            }

                            transform = field.mmTransformInput[kind];
                            _context3.t0 = _objectSpread2.default;
                            _context3.t1 = {};
                            _context3.t2 = data;
                            _context3.next = 9;
                            return transform((0, _defineProperty2.default)({}, fieldName, data[fieldName] || null), context);

                          case 9:
                            _context3.t3 = _context3.sent;
                            data = (0, _context3.t0)(_context3.t1, _context3.t2, _context3.t3);

                          case 11:
                          case "end":
                            return _context3.stop();
                        }
                      }
                    }, _callee3, this);
                  }));

                  return function (_x7) {
                    return _ref5.apply(this, arguments);
                  };
                }());

              case 3:
                return _context4.abrupt("return", data);

              case 4:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function (_x4, _x5, _x6) {
        return _ref3.apply(this, arguments);
      };
    }()
  );
};

exports.applyAlwaysInputTransform = applyAlwaysInputTransform;

var applyInputTransform = function applyInputTransform(context) {
  return (
    /*#__PURE__*/
    function () {
      var _ref7 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee6(value, type) {
        var fields, result;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(type instanceof _graphql.GraphQLList)) {
                  _context6.next = 6;
                  break;
                }

                _context6.next = 3;
                return Promise.all(value.map(function (val) {
                  return applyInputTransform(context)(val, type.ofType);
                }));

              case 3:
                return _context6.abrupt("return", _context6.sent);

              case 6:
                if (!(type instanceof _graphql.GraphQLNonNull)) {
                  _context6.next = 8;
                  break;
                }

                return _context6.abrupt("return", applyInputTransform(context)(value, type.ofType));

              case 8:
                fields = type._fields;

                if (fields) {
                  _context6.next = 11;
                  break;
                }

                return _context6.abrupt("return", value);

              case 11:
                result = {};
                _context6.next = 14;
                return (0, _utils.asyncForEach)(_lodash.default.keys(value),
                /*#__PURE__*/
                function () {
                  var _ref8 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee5(key) {
                    var field, val;
                    return _regenerator.default.wrap(function _callee5$(_context5) {
                      while (1) {
                        switch (_context5.prev = _context5.next) {
                          case 0:
                            field = fields[key];

                            if (field) {
                              _context5.next = 4;
                              break;
                            }

                            console.log("Key", key, "fields", fields);
                            throw 'Wrong type for input provided';

                          case 4:
                            val = value[key];
                            _context5.t0 = _objectSpread2.default;
                            _context5.t1 = {};
                            _context5.t2 = result;

                            if (!field.mmTransform) {
                              _context5.next = 14;
                              break;
                            }

                            _context5.next = 11;
                            return field.mmTransform((0, _defineProperty2.default)({}, key, val), context);

                          case 11:
                            _context5.t3 = _context5.sent;
                            _context5.next = 21;
                            break;

                          case 14:
                            _context5.t4 = _defineProperty2.default;
                            _context5.t5 = {};
                            _context5.t6 = key;
                            _context5.next = 19;
                            return applyInputTransform(context)(val, field.type);

                          case 19:
                            _context5.t7 = _context5.sent;
                            _context5.t3 = (0, _context5.t4)(_context5.t5, _context5.t6, _context5.t7);

                          case 21:
                            _context5.t8 = _context5.t3;
                            result = (0, _context5.t0)(_context5.t1, _context5.t2, _context5.t8);

                          case 23:
                          case "end":
                            return _context5.stop();
                        }
                      }
                    }, _callee5, this);
                  }));

                  return function (_x10) {
                    return _ref8.apply(this, arguments);
                  };
                }());

              case 14:
                return _context6.abrupt("return", result);

              case 15:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function (_x8, _x9) {
        return _ref7.apply(this, arguments);
      };
    }()
  );
};

exports.applyInputTransform = applyInputTransform;

function appendTransform(field, handler, functions) {
  if (!field[handler]) field[handler] = {};
  field[handler] = (0, _objectSpread2.default)({}, field[handler], functions);
}