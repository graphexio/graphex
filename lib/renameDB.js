"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RenameDBResolver = RenameDBResolver;
exports.default = exports.RenameDBScheme = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var RenameDBScheme = "directive @renameDB(name:String!) on FIELD_DEFINITION";
exports.RenameDBScheme = RenameDBScheme;

var RenameDB =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(RenameDB, _SchemaDirectiveVisit);

  function RenameDB() {
    (0, _classCallCheck2.default)(this, RenameDB);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(RenameDB).apply(this, arguments));
  }

  (0, _createClass2.default)(RenameDB, [{
    key: "visitFieldDefinition",
    value: function visitFieldDefinition(field) {
      var name = this.args.name;
      var resolveMapFilterToSelector = field.resolveMapFilterToSelector;

      field.resolveMapFilterToSelector =
      /*#__PURE__*/
      function () {
        var _ref = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee(params) {
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!resolveMapFilterToSelector) {
                    _context.next = 4;
                    break;
                  }

                  _context.next = 3;
                  return resolveMapFilterToSelector.apply(this, params);

                case 3:
                  params = _context.sent;

                case 4:
                  return _context.abrupt("return", params.map(function (_ref2) {
                    var fieldName = _ref2.fieldName,
                        value = _ref2.value;
                    return {
                      fieldName: name,
                      value: value
                    };
                  }));

                case 5:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }();
    }
  }]);
  return RenameDB;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = RenameDB;

function RenameDBResolver(next, source, args, ctx, info) {
  var name = args.name;
  info.fieldName = name;
  return next(); // console.log({ next, source, args, ctx, info });
}