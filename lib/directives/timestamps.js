"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimestampResolver = TimestampResolver;
exports.TimestampDirective = void 0;

var _objectSpread3 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _graphqlTools = require("graphql-tools");

var TimestampDirective =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(TimestampDirective, _SchemaDirectiveVisit);

  function TimestampDirective() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, TimestampDirective);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(TimestampDirective)).call.apply(_getPrototypeOf2, [this].concat(args)));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_setDate", function (fieldName, dbName) {
      return function (params) {
        if (!dbName) {
          dbName = fieldName;
        }

        return (0, _objectSpread3.default)({}, _.omit(params, fieldName), (0, _defineProperty2.default)({}, dbName, new Date()));
      };
    });
    return _this;
  }

  return TimestampDirective;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.TimestampDirective = TimestampDirective;

function TimestampResolver(next, source, args, ctx, info) {
  var name = args.name;

  if (name) {
    info.fieldName = name;
  }

  return next();
}