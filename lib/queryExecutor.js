"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UPDATE_MANY = exports.UPDATE_ONE = exports.DELETE_MANY = exports.DELETE_ONE = exports.INSERT_MANY = exports.INSERT_ONE = exports.DISTINCT = exports.COUNT = exports.FIND_IDS = exports.FIND_ONE = exports.FIND = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectSpread3 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

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
var DELETE_MANY = 'deleteMany';
exports.DELETE_MANY = DELETE_MANY;
var UPDATE_ONE = 'updateOne';
exports.UPDATE_ONE = UPDATE_ONE;
var UPDATE_MANY = 'updateMany';
exports.UPDATE_MANY = UPDATE_MANY;
var dataLoaders = {};

var buildDataLoaderWithSelector = function buildDataLoaderWithSelector(db, collectionName, selectorField) {
  var selector = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var Collection = db.collection(collectionName);
  return new _dataloader.default(function (keys) {
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
};

var hasDataLoader = function hasDataLoader(key) {
  return Object.keys(dataLoaders).includes(key);
};

var dataLoaderKey = function dataLoaderKey(collectionName, selectorField) {
  var selector = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var params = Object.entries(selector).sort(function (a, b) {
    return a[0] > b[0];
  }).map(function (_ref) {
    var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
        k = _ref2[0],
        v = _ref2[1];

    return "".concat(k, ":").concat(JSON.stringify(v));
  });

  if (params) {
    params = ":" + params.join(':');
  }

  var key = "".concat(collectionName, ":").concat(selectorField).concat(params);
  console.log(key);
  return key;
};

var dbResolver = function dbResolver(t, c, data) {
  if (t.indexOf('Post') !== -1) {
    return;
  }

  return data;
};

var queryExecutor = function queryExecutor(_ref3) {
  var db = _ref3.db,
      _ref3$hooks = _ref3.hooks,
      hooks = _ref3$hooks === void 0 ? {} : _ref3$hooks,
      _ref3$dbResolve = _ref3.dbResolve,
      dbResolve = _ref3$dbResolve === void 0 ? dbResolver : _ref3$dbResolve;
  return (
    /*#__PURE__*/
    function () {
      var _ref4 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(params) {
        var type, collectionName, doc, docs, selector, _params$options, options, _params$context, context, skip, limit, sort, _options$arrayFilters, arrayFilters, Collection, cursor, dlKey, dataLoader, _dlKey, _dataLoader, _cursor, _cursor2;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                type = params.type, collectionName = params.collection, doc = params.doc, docs = params.docs, selector = params.selector, _params$options = params.options, options = _params$options === void 0 ? {} : _params$options, _params$context = params.context, context = _params$context === void 0 ? {} : _params$context; // console.dir({ type, collection, selector, options }, { depth: null });

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
                _context.next = _context.t0 === FIND ? 6 : _context.t0 === FIND_ONE ? 12 : _context.t0 === FIND_IDS ? 19 : _context.t0 === COUNT ? 27 : _context.t0 === DISTINCT ? 33 : _context.t0 === INSERT_ONE ? 39 : _context.t0 === INSERT_MANY ? 41 : _context.t0 === DELETE_MANY ? 42 : _context.t0 === DELETE_ONE ? 43 : _context.t0 === UPDATE_MANY ? 44 : _context.t0 === UPDATE_ONE ? 45 : 47;
                break;

              case 6:
                selector = dbResolve(FIND, collectionName, selector, context);
                cursor = Collection.find(selector);
                if (skip) cursor = cursor.skip(skip);
                if (limit) cursor = cursor.limit(limit);
                if (sort) cursor = cursor.sort(sort);
                return _context.abrupt("return", cursor.toArray().then(function (data) {
                  return data;
                }).catch(function (e) {
                  console.log(e);
                }));

              case 12:
                selector = dbResolve(FIND, collectionName, selector, context);
                options.id = options.id || selector[options.selectorField];
                selector = (0, _objectSpread3.default)({}, _lodash.default.omit(selector, options.selectorField));
                dlKey = dataLoaderKey(collectionName, options.selectorField, selector);

                if (!hasDataLoader(dlKey)) {
                  dataLoaders[dlKey] = buildDataLoaderWithSelector(db, collectionName, options.selectorField, selector);
                }

                dataLoader = dataLoaders[dlKey];
                return _context.abrupt("return", options.id ? dataLoader.load(options.id) : Promise.resolve(null));

              case 19:
                selector = dbResolve(FIND, collectionName, selector, context);
                selector = (0, _objectSpread3.default)({}, _lodash.default.omit(selector, options.selectorField));
                _dlKey = dataLoaderKey(collectionName, options.selectorField, selector);

                if (!hasDataLoader(_dlKey)) {
                  dataLoaders[_dlKey] = buildDataLoaderWithSelector(db, collectionName, options.selectorField, selector);
                }

                _dataLoader = dataLoaders[_dlKey];

                if (!options.ids) {
                  options.ids = [];
                }

                if (!Array.isArray(options.ids)) {
                  options.ids = [options.ids];
                }

                return _context.abrupt("return", _dataLoader.loadMany(options.ids));

              case 27:
                selector = dbResolve(FIND, collectionName, selector, context);
                _cursor = Collection.find(selector);
                if (skip) _cursor = _cursor.skip(skip);
                if (limit) _cursor = _cursor.limit(limit);
                if (sort) _cursor = _cursor.sort(sort);
                return _context.abrupt("return", _cursor.count(true));

              case 33:
                selector = dbResolve(FIND, collectionName, selector, context);
                _cursor2 = Collection.find(selector);
                if (skip) _cursor2 = _cursor2.skip(skip);
                if (limit) _cursor2 = _cursor2.limit(limit);
                if (sort) _cursor2 = _cursor2.sort(sort);
                return _context.abrupt("return", _cursor2.toArray().then(function (data) {
                  return data.map(function (item) {
                    return item[options.key];
                  });
                }));

              case 39:
                doc = dbResolve(INSERT_ONE + "Pre", collectionName, doc, context);
                return _context.abrupt("return", Collection.insertOne(doc).then(function (res) {
                  var data = _lodash.default.head(res.ops);

                  var _id = data._id;
                  var update = dbResolve(INSERT_ONE + "Post", collectionName, data, context);

                  if (update) {
                    return Collection.findOneAndUpdate({
                      _id: _id
                    }, update, {
                      returnOriginal: false
                    }).then(function (res) {
                      return res.value;
                    });
                  }

                  return data;
                }));

              case 41:
                return _context.abrupt("return", Collection.insertMany(docs).then(function (res) {
                  return res.ops;
                }));

              case 42:
                return _context.abrupt("return", Collection.deleteMany(selector).then(function (res) {
                  return res.deletedCount;
                }));

              case 43:
                return _context.abrupt("return", Collection.findOneAndDelete(selector).then(function (res) {
                  return res.deletedCount;
                }));

              case 44:
                return _context.abrupt("return", Collection.updateMany(selector, docs, {
                  arrayFilters: arrayFilters
                }).then(function (res) {
                  return res.ops;
                }));

              case 45:
                doc = dbResolve(UPDATE_ONE + "Pre", collectionName, doc, context);
                return _context.abrupt("return", Collection.findOneAndUpdate(selector, doc, {
                  returnOriginal: false,
                  arrayFilters: arrayFilters
                }).then(function (res) {
                  var data = res.value;
                  var update = dbResolve(UPDATE_ONE + "Post", collectionName, data, context);

                  if (update) {
                    return Collection.findOneAndUpdate(selector, update, {
                      returnOriginal: false,
                      arrayFilters: arrayFilters
                    }).then(function (res) {
                      return res.value;
                    });
                  }

                  return data;
                }));

              case 47:
                return _context.abrupt("return", null);

              case 48:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function (_x) {
        return _ref4.apply(this, arguments);
      };
    }()
  );
};

var _default = queryExecutor;
exports.default = _default;