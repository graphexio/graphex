"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UPDATE_MANY = exports.UPDATE_ONE = exports.DELETE_ONE = exports.INSERT_MANY = exports.INSERT_ONE = exports.DISTINCT = exports.COUNT = exports.FIND_IDS = exports.FIND_ONE = exports.FIND = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _pluralize = _interopRequireDefault(require("pluralize"));

var _lodash = _interopRequireDefault(require("lodash"));

var _dataloader = _interopRequireDefault(require("dataloader"));

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
var UPDATE_ONE = 'updateOne';
exports.UPDATE_ONE = UPDATE_ONE;
var UPDATE_MANY = 'updateMany';
exports.UPDATE_MANY = UPDATE_MANY;
var dataLoaders = {};

var buildDataLoader = function buildDataLoader(db, collectionName, selectorField) {
  var Collection = db.collection(collectionName);
  return new _dataloader.default(function (keys) {
    return Collection.find((0, _defineProperty2.default)({}, selectorField, {
      $in: keys
    })).toArray().then(function (data) {
      return keys.map(function (key) {
        return data.find(function (item) {
          return item[selectorField] === key;
        }) || null;
      });
    });
  }, {
    cache: false
  });
};

var _default = function _default(db) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(params) {
        var type, collectionName, doc, docs, selector, _params$options, options, skip, limit, sort, _options$arrayFilters, arrayFilters, Collection, cursor, dataLoaderKey, dataLoader, _dataLoaderKey, _dataLoader, _cursor, _cursor2;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                type = params.type, collectionName = params.collection, doc = params.doc, docs = params.docs, selector = params.selector, _params$options = params.options, options = _params$options === void 0 ? {} : _params$options; // console.dir({ type, collection, selector, options }, { depth: null });

                skip = options.skip, limit = options.limit, sort = options.sort, _options$arrayFilters = options.arrayFilters, arrayFilters = _options$arrayFilters === void 0 ? [] : _options$arrayFilters; //
                // console.log('\n\n');
                // console.log({ type, collection });
                // console.log('selector');
                // console.dir(selector, { depth: null });
                // console.dir({ options });
                // console.log('doc');
                // console.dir(doc, { depth: null });
                // console.log('\n\n');

                Collection = db.collection(collectionName);
                _context.t0 = type;
                _context.next = _context.t0 === FIND ? 6 : _context.t0 === FIND_ONE ? 11 : _context.t0 === FIND_IDS ? 15 : _context.t0 === COUNT ? 19 : _context.t0 === DISTINCT ? 24 : _context.t0 === INSERT_ONE ? 29 : _context.t0 === INSERT_MANY ? 30 : _context.t0 === DELETE_ONE ? 31 : _context.t0 === UPDATE_ONE ? 32 : 33;
                break;

              case 6:
                cursor = Collection.find(selector);
                if (skip) cursor = cursor.skip(skip);
                if (limit) cursor = cursor.limit(limit);
                if (sort) cursor = cursor.sort(sort);
                return _context.abrupt("return", cursor.toArray());

              case 11:
                dataLoaderKey = "".concat(collectionName, ":").concat(options.selectorField);

                if (!Object.keys(dataLoaders).includes(dataLoaderKey)) {
                  dataLoaders[dataLoaderKey] = buildDataLoader(db, collectionName, options.selectorField);
                }

                dataLoader = dataLoaders[dataLoaderKey];
                return _context.abrupt("return", dataLoader.load(options.id));

              case 15:
                _dataLoaderKey = "".concat(collectionName, ":").concat(options.selectorField);

                if (!Object.keys(dataLoaders).includes(_dataLoaderKey)) {
                  dataLoaders[_dataLoaderKey] = buildDataLoader(db, collectionName, options.selectorField);
                }

                _dataLoader = dataLoaders[_dataLoaderKey];
                return _context.abrupt("return", _dataLoader.loadMany(options.ids));

              case 19:
                _cursor = Collection.find(selector);
                if (skip) _cursor = _cursor.skip(skip);
                if (limit) _cursor = _cursor.limit(limit);
                if (sort) _cursor = _cursor.sort(sort);
                return _context.abrupt("return", _cursor.count(true));

              case 24:
                _cursor2 = Collection.find(selector);
                if (skip) _cursor2 = _cursor2.skip(skip);
                if (limit) _cursor2 = _cursor2.limit(limit);
                if (sort) _cursor2 = _cursor2.sort(sort);
                return _context.abrupt("return", _cursor2.toArray().then(function (data) {
                  return data.map(function (item) {
                    return item[options.key];
                  });
                }));

              case 29:
                return _context.abrupt("return", Collection.insertOne(doc).then(function (res) {
                  return _lodash.default.head(res.ops);
                }));

              case 30:
                return _context.abrupt("return", Collection.insertMany(docs).then(function (res) {
                  return res.ops;
                }));

              case 31:
                return _context.abrupt("return", Collection.findOneAndDelete(selector).then(function (res) {
                  return res.value;
                }));

              case 32:
                return _context.abrupt("return", Collection.findOneAndUpdate(selector, doc, {
                  returnOriginal: false,
                  arrayFilters: arrayFilters
                }).then(function (res) {
                  return res.value;
                }));

              case 33:
                return _context.abrupt("return", null);

              case 34:
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