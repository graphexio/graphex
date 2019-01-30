"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UPDATE_MANY = exports.UPDATE_ONE = exports.DELETE_MANY = exports.DELETE_ONE = exports.INSERT_MANY = exports.INSERT_ONE = exports.DISTINCT = exports.COUNT = exports.FIND_IDS = exports.FIND_ONE = exports.FIND = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectSpread3 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _pluralize = _interopRequireDefault(require("pluralize"));

var _lodash = _interopRequireDefault(require("lodash"));

var _dataloader = _interopRequireDefault(require("dataloader"));

var _objectHash = _interopRequireDefault(require("object-hash"));

var FIND = 'find';
exports.FIND = FIND;
var FIND_ONE = 'findOne';
exports.FIND_ONE = FIND_ONE;
var FIND_IDS = 'findIds';
exports.FIND_IDS = FIND_IDS;
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
var DELETE_MANY = 'deleteMany';
exports.DELETE_MANY = DELETE_MANY;
var UPDATE_ONE = 'updateOne';
exports.UPDATE_ONE = UPDATE_ONE;
var UPDATE_MANY = 'updateMany';
exports.UPDATE_MANY = UPDATE_MANY;
var dataLoaders = {};

var getDataLoader = function getDataLoader(db, collectionName, selectorField) {
  var selector = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var key = (0, _objectHash.default)({
    collectionName: collectionName,
    selectorField: selectorField,
    selector: selector
  });

  if (!dataLoaders[key]) {
    var Collection = db.collection(collectionName);
    dataLoaders[key] = new _dataloader.default(function (keys) {
      return Collection.find((0, _objectSpread3.default)((0, _defineProperty2.default)({}, selectorField, {
        $in: keys
      }), selector)).toArray().then(function (data) {
        return keys.map(function (key) {
          return data.find(function (item) {
            return item[selectorField].toString() === key.toString();
          }) || null;
        });
      });
    }, {
      cache: false
    });
  }

  return dataLoaders[key];
};

var queryExecutor = function queryExecutor(db) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(params) {
        var type, collectionName, doc, docs, selector, _params$options, options, _params$context, context, skip, limit, sort, _options$arrayFilters, arrayFilters, Collection, cursor, _cursor, _cursor2;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                type = params.type, collectionName = params.collection, doc = params.doc, docs = params.docs, selector = params.selector, _params$options = params.options, options = _params$options === void 0 ? {} : _params$options, _params$context = params.context, context = _params$context === void 0 ? {} : _params$context; // console.dir({ type, collection, selector, options }, { depth: null });

                skip = options.skip, limit = options.limit, sort = options.sort, _options$arrayFilters = options.arrayFilters, arrayFilters = _options$arrayFilters === void 0 ? [] : _options$arrayFilters; //

                console.log('\n\n');
                console.log({
                  type: type,
                  collectionName: collectionName
                });
                console.log('selector');
                console.dir(selector, {
                  depth: null
                });
                console.dir({
                  options: options
                });
                console.log('doc');
                console.dir(doc, {
                  depth: null
                });
                console.log('\n\n');
                Collection = db.collection(collectionName);
                _context.t0 = type;
                _context.next = _context.t0 === FIND ? 14 : _context.t0 === FIND_ONE ? 19 : _context.t0 === FIND_IDS ? 20 : _context.t0 === COUNT ? 24 : _context.t0 === DISTINCT ? 29 : _context.t0 === INSERT_ONE ? 34 : _context.t0 === INSERT_MANY ? 35 : _context.t0 === DELETE_MANY ? 36 : _context.t0 === DELETE_ONE ? 37 : _context.t0 === UPDATE_MANY ? 38 : _context.t0 === UPDATE_ONE ? 39 : 40;
                break;

              case 14:
                cursor = Collection.find(selector);
                if (skip) cursor = cursor.skip(skip);
                if (limit) cursor = cursor.limit(limit);
                if (sort) cursor = cursor.sort(sort);
                return _context.abrupt("return", cursor.toArray().then(function (data) {
                  return data;
                }).catch(function (e) {
                  console.log(e);
                }));

              case 19:
                return _context.abrupt("return", Collection.findOne(selector));

              case 20:
                selector = (0, _objectSpread3.default)({}, _lodash.default.omit(selector, options.selectorField)); //BUG selectorField may be in nested operator ($and for example)

                if (!options.ids) {
                  options.ids = [];
                }

                if (!Array.isArray(options.ids)) {
                  options.ids = [options.ids];
                }

                return _context.abrupt("return", getDataLoader(db, collectionName, options.selectorField, selector).loadMany(options.ids));

              case 24:
                _cursor = Collection.find(selector);
                if (skip) _cursor = _cursor.skip(skip);
                if (limit) _cursor = _cursor.limit(limit);
                if (sort) _cursor = _cursor.sort(sort);
                return _context.abrupt("return", _cursor.count(true));

              case 29:
                _cursor2 = Collection.find(selector);
                if (skip) _cursor2 = _cursor2.skip(skip);
                if (limit) _cursor2 = _cursor2.limit(limit);
                if (sort) _cursor2 = _cursor2.sort(sort);
                return _context.abrupt("return", _cursor2.toArray().then(function (data) {
                  return data.map(function (item) {
                    return item[options.key];
                  });
                }));

              case 34:
                return _context.abrupt("return", Collection.insertOne(doc).then(function (res) {
                  return _lodash.default.head(res.ops);
                }));

              case 35:
                return _context.abrupt("return", Collection.insertMany(docs).then(function (res) {
                  return res.ops;
                }));

              case 36:
                return _context.abrupt("return", Collection.deleteMany(selector).then(function (res) {
                  return res.deletedCount;
                }));

              case 37:
                return _context.abrupt("return", Collection.findOneAndDelete(selector).then(function (res) {
                  return res.deletedCount;
                }));

              case 38:
                return _context.abrupt("return", Collection.updateMany(selector, docs, {
                  arrayFilters: arrayFilters
                }).then(function (res) {
                  return res.ops;
                }));

              case 39:
                return _context.abrupt("return", Collection.findOneAndUpdate(selector, doc, {
                  returnOriginal: false,
                  arrayFilters: arrayFilters
                }).then(function (res) {
                  return res.value;
                }));

              case 40:
                return _context.abrupt("return", null);

              case 41:
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

var _default = queryExecutor;
exports.default = _default;