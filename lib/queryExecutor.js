"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _pluralize = _interopRequireDefault(require("pluralize"));

var _default = function _default(db) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(params) {
        var type, collection, doc, selector, options, skip, limit, sort, collectionName, Collection, cursor, _cursor, d;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                type = params.type, collection = params.collection, doc = params.doc, selector = params.selector, options = params.options; // console.dir({ type, collection, selector, options }, { depth: null });

                skip = options.skip, limit = options.limit, sort = options.sort;
                collectionName = (0, _pluralize.default)(collection.toLowerCase());
                Collection = db.collection(collectionName);
                _context.t0 = type;
                _context.next = _context.t0 === 'find' ? 7 : _context.t0 === 'findOne' ? 11 : _context.t0 === 'count' ? 12 : _context.t0 === 'distinct' ? 13 : _context.t0 === 'insert' ? 17 : _context.t0 === 'remove' ? 18 : _context.t0 === 'update' ? 24 : 27;
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
                  return res.ops[0];
                }));

              case 18:
                _context.next = 20;
                return Collection.findOne(selector);

              case 20:
                d = _context.sent;
                _context.next = 23;
                return Collection.removeOne(selector);

              case 23:
                return _context.abrupt("return", d);

              case 24:
                _context.next = 26;
                return Collection.update(selector, {
                  $set: doc
                });

              case 26:
                return _context.abrupt("return", Collection.findOne(selector));

              case 27:
                return _context.abrupt("return", null);

              case 28:
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