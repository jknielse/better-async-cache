var _      = require('lodash');
var fs     = require('fs');
var mkdirp = require('mkdirp');
var path   = require('path');

function Cache (opts) {
  var self = this;
  if (!opts.path) throw new Error('better-async-cache must have a "path" key in the options object');
  if (!opts.getters) throw new Error('better-async-cache must have a "getters" key in the options object');
  mkdirp.sync(path.dirname(opts.path));
  self._path = opts.path;
  self._getters = opts.getters;
  try {
    self._cache = JSON.parse(fs.readFileSync(self._path));
  } catch (err) {}

  if (!self._cache) {
    self._cache = {};
  }
}

Cache.prototype.get = function (type, key, cb) {
  var self = this;
  if (!self._getters[type]) return setImmediate(() => { cb('unknown_type') });
  var val = _.get(self._cache, [type, key]);
  if (val !== undefined) return setImmediate(() => { cb(null, val) });
  self._getters[type](key, function (err, val) {
    if (err) return cb(err);
    if (!self._cache[type]) self._cache[type] = {};
    self._cache[type][key] = val;
    fs.writeFile(self._path, JSON.stringify(self._cache), function (err) {
      if (err) return cb(err);
      cb(null, val);
    });
  })
}

module.exports = Cache;
