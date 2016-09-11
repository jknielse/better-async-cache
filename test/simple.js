var assert = require('assert');
var fs     = require('fs');
var Cache  = require('../index');

var cacheMissCount;
var testCachePath = './testcache/test.json';
var testGetters = {
  'noop': function (key, cb) {
    setImmediate(function () {
      cacheMissCount++;
      return cb(null, key);
    })
  },
  'fail': function (key, cb) {
    setImmediate(function () {
      cacheMissCount++;
      return cb('bad_error');
    })
  }
}

describe('Simple', function () {
  beforeEach(function (done) {
    cacheMissCount = 0;
    done();
  });
  afterEach(function (done) {
    fs.unlink(testCachePath, function (err) {
      done();
    });
  });

  it('one cache miss', function (done) {
    var cache = new Cache({
      path: testCachePath,
      getters: testGetters
    });

    cache.get('noop', 'key1', function (err, val) {
      assert.equal('key1', val);
      assert.equal(cacheMissCount, 1);
      done();
    });
  });

  it('one miss, one hit', function (done) {
    var cache = new Cache({
      path: testCachePath,
      getters: testGetters
    });

    cache.get('noop', 'key1', function (err, val) {
      cache.get('noop', 'key1', function (err, val2) {
        assert.equal('key1', val);
        assert.equal('key1', val2);
        assert.equal(cacheMissCount, 1);
        done();
      })
    });
  });

  it('errs get passed on', function (done) {
    var cache = new Cache({
      path: testCachePath,
      getters: testGetters
    });

    cache.get('fail', 'key1', function (err, val) {
      assert.equal(err, 'bad_error');
      assert.equal(cacheMissCount, 1);
      assert.ok(!val);
      done();
    });
  });

  it('errs dont get cached', function (done) {
    var cache = new Cache({
      path: testCachePath,
      getters: testGetters
    });

    cache.get('fail', 'key1', function (err, val) {
      cache.get('fail', 'key1', function (err2, val2) {
        assert.equal(err, 'bad_error');
        assert.ok(!val);
        assert.equal(err2, 'bad_error');
        assert.ok(!val2);
        assert.equal(cacheMissCount, 2);
        done();
      });
    });
  });

  it('type miss returns error', function (done) {
    var cache = new Cache({
      path: testCachePath,
      getters: testGetters
    });

    cache.get('nothing', 'key1', function (err, val) {
      assert.equal(err, 'unknown_type');
      assert.ok(!val);
      assert.equal(cacheMissCount, 0);
      done();
    });
  });
});