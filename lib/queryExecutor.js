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
        var type, collection, doc, docs, selector, _params$options, options, skip, limit, sort, collectionName, Collection, cursor, _cursor;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                type = params.type, collection = params.collection, doc = params.doc, docs = params.docs, selector = params.selector, _params$options = params.options, options = _params$options === void 0 ? {} : _params$options; // console.dir({ type, collection, selector, options }, { depth: null });

                skip = options.skip, limit = options.limit, sort = options.sort; // console.log({ type, collection });
                // console.log('selector');
                // console.dir(selector, { depth: null });
                // console.log('doc');
                // console.dir(doc, { depth: null });

                collectionName = (0, _pluralize.default)(collection.toLowerCase());
                Collection = db.collection(collectionName);
                _context.t0 = type;
                _context.next = _context.t0 === FIND ? 7 : _context.t0 === FIND_ONE ? 11 : _context.t0 === COUNT ? 12 : _context.t0 === DISTINCT ? 13 : _context.t0 === INSERT_ONE ? 17 : _context.t0 === INSERT_MANY ? 18 : _context.t0 === DELETE_ONE ? 19 : _context.t0 === UPDATE_ONE ? 20 : 21;
                break;

              case 7:
                cursor = Collection.find(selector);
                if (limit) cursor = cursor.limit(limit);
                if (sort) cursor = cursor.sort(sort);
                return _context.abrupt("return", cursor.toArray());

              case 11:
                return _context.abrupt("return", Collection.findOne(selector));

              case 12:
                return _context.abrupt("return", Collection.find(selector).count());

              case 13:
                _cursor = Collection.find(selector);
                if (limit) _cursor = _cursor.limit(limit);
                if (sort) _cursor = _cursor.sort(sort);
                return _context.abrupt("return", _cursor.toArray().then(function (data) {
                  return data.map(function (item) {
                    return item[options.key];
                  });
                }));

              case 17:
                return _context.abrupt("return", Collection.insertOne(doc).then(function (res) {
                  return _lodash.default.head(res.ops);
                }));

              case 18:
                return _context.abrupt("return", Collection.insertMany(docs).then(function (res) {
                  return res.ops;
                }));

              case 19:
                return _context.abrupt("return", Collection.findOneAndDelete(selector).then(function (res) {
                  return res.value;
                }));

              case 20:
                return _context.abrupt("return", Collection.findOneAndUpdate(selector, {
                  $set: doc
                }, {
                  returnOriginal: false
                }).then(function (res) {
                  return res.value;
                }));

              case 21:
                return _context.abrupt("return", null);

              case 22:
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