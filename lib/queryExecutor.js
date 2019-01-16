"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UPDATE_MANY = exports.UPDATE_ONE = exports.DELETE_ONE = exports.INSERT_MANY = exports.INSERT_ONE = exports.DISTINCT = exports.COUNT = exports.FIND_ONE = exports.FIND = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _pluralize = _interopRequireDefault(require("pluralize"));

var _lodash = _interopRequireDefault(require("lodash"));

var FIND = 'find';
exports.FIND = FIND;
var FIND_ONE = 'findOne';
exports.FIND_ONE = FIND_ONE;
var COUNT = 'count';
exports.COUNT = COUNT;
var DISTINCT = 'distinct';
exports.DISTINCT = DISTINCT;
var INSERT_ONE = 'insertOne';
exports.INSERT_ONE = INSERT_ONE;
var INSERT_MANY = 'insertMany';
exports.INSERT_MANY = INSERT_MANY;
var DELETE_ONE = 'deleteOne';
exports.DELETE_ONE = DELETE_ONE;
var UPDATE_ONE = 'updateOne';
exports.UPDATE_ONE = UPDATE_ONE;
var UPDATE_MANY = 'updateMany';
exports.UPDATE_MANY = UPDATE_MANY;

var _default = function _default(db) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(params) {
        var type, collection, doc, docs, selector, _params$options, options, skip, limit, sort, _options$arrayFilters, arrayFilters, collectionName, Collection, cursor, _cursor, _cursor2;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                type = params.type, collection = params.collection, doc = params.doc, docs = params.docs, selector = params.selector, _params$options = params.options, options = _params$options === void 0 ? {} : _params$options; // console.dir({ type, collection, selector, options }, { depth: null });

                skip = options.skip, limit = options.limit, sort = options.sort, _options$arrayFilters = options.arrayFilters, arrayFilters = _options$arrayFilters === void 0 ? [] : _options$arrayFilters; // console.log({ type, collection });
                // console.log('selector');
                // console.dir(selector, { depth: null });
                // console.dir({ options });
                // console.log('doc');
                // console.dir(doc, { depth: null });

                collectionName = (0, _pluralize.default)(collection.toLowerCase());
                Collection = db.collection(collectionName);
                _context.t0 = type;
                _context.next = _context.t0 === FIND ? 7 : _context.t0 === FIND_ONE ? 12 : _context.t0 === COUNT ? 13 : _context.t0 === DISTINCT ? 18 : _context.t0 === INSERT_ONE ? 23 : _context.t0 === INSERT_MANY ? 25 : _context.t0 === DELETE_ONE ? 26 : _context.t0 === UPDATE_ONE ? 27 : 28;
                break;

              case 7:
                cursor = Collection.find(selector);
                if (skip) cursor = cursor.skip(skip);
                if (limit) cursor = cursor.limit(limit);
                if (sort) cursor = cursor.sort(sort);
                return _context.abrupt("return", cursor.toArray());

              case 12:
                return _context.abrupt("return", Collection.findOne(selector));

              case 13:
                _cursor = Collection.find(selector);
                if (skip) _cursor = _cursor.skip(skip);
                if (limit) _cursor = _cursor.limit(limit);
                if (sort) _cursor = _cursor.sort(sort);
                return _context.abrupt("return", _cursor.count(true));

              case 18:
                _cursor2 = Collection.find(selector);
                if (skip) _cursor2 = _cursor2.skip(skip);
                if (limit) _cursor2 = _cursor2.limit(limit);
                if (sort) _cursor2 = _cursor2.sort(sort);
                return _context.abrupt("return", _cursor2.toArray().then(function (data) {
                  return data.map(function (item) {
                    return item[options.key];
                  });
                }));

              case 23:
                return _context.abrupt("return", Collection.insertOne(doc).then(function (res) {
                  return _lodash.default.head(res.ops);
                }));

              case 25:
                return _context.abrupt("return", Collection.insertMany(docs).then(function (res) {
                  return res.ops;
                }));

              case 26:
                return _context.abrupt("return", Collection.findOneAndDelete(selector).then(function (res) {
                  return res.value;
                }));

              case 27:
                return _context.abrupt("return", Collection.findOneAndUpdate(selector, doc, {
                  returnOriginal: false,
                  arrayFilters: arrayFilters
                }).then(function (res) {
                  return res.value;
                }));

              case 28:
                return _context.abrupt("return", null);

              case 29:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }()
  );
};

exports.default = _default;