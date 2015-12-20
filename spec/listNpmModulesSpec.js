var fs = require('fs');
var request = require('request');
var listNpmModules = require('../index');
console.info = function() {};

describe('When cache file does exist', function () {
	var result;

	beforeEach(function () {
		listNpmModules._setCache({});
	});

	describe('and registry returns 200', function () {
		beforeEach(function (done) {
			spyOn(request, 'get').and.callFake(function (options, handler) {
				var err;
				var res = {
					statusCode: 200,
					headers: {
						etag: 'myEtag'
					}
				};
				var body = {'a': {}, 'b': {}, 'c': {}};
				handler(err, res, body);
			});

			spyOn(fs, 'writeFile');

			listNpmModules(function (_result) {
				result = _result;
				done();
			});
		});

		it('should download a fresh list', function () {
			expect(request.get).toHaveBeenCalled();
		});

		it('should update cache file', function () {
			expect(fs.writeFile).toHaveBeenCalledWith(
				'./cache.json',
				jasmine.any(String),
				jasmine.any(Function)
			);
		});

		it('should update the cache file with correct content', function () {
			var fileContent = fs.writeFile.calls.argsFor(0)[1];
			if(fileContent) {
				expect(JSON.parse(fileContent)).toEqual({
					timestamp: jasmine.any(Number),
					etag: 'myEtag',
					keys: ['a', 'b', 'c']
				});
			}
		});

		it('should return results from response', function () {
			expect(result).toEqual([ 'a', 'b', 'c' ]);
		});
	});
});

describe('when cache file exists', function () {
	var result, npmKeysCache;

	beforeEach(function () {
		npmKeysCache = {
			etag: 'myEtag',
			timestamp: 'myTimestamp',
			keys: ['a', 'b', 'c']
		};
		listNpmModules._setCache(npmKeysCache);
	});

	describe('and cache is stale', function () {
		beforeEach(function () {
			spyOn(listNpmModules, '_isStale').and.returnValue(true);
		});

		describe('and registry returns 304', function () {
			beforeEach(function (done) {
				spyOn(request, 'get').and.callFake(function (options, handler) {
					var err;
					var res = {
						statusCode: 304
					};
					var body = null;
					handler(err, res, body);
				});

				spyOn(fs, 'writeFile');

				listNpmModules(function (_result) {
					result = _result;
					done();
				});
			});

			it('should update timestamp in cache file', function () {
				var fileContent = fs.writeFile.calls.argsFor(0)[1];
				expect(JSON.parse(fileContent)).toEqual({
					timestamp: jasmine.any(Number),
					etag: npmKeysCache.etag,
					keys: npmKeysCache.keys
				});
			});
			it('should return results from cache', function () {
				expect(result).toEqual(npmKeysCache.keys);
			});
		});
	});

	describe('and cache is not stale', function () {
		var result;
		beforeEach(function (done) {
			spyOn(listNpmModules, '_isStale').and.returnValue(false);

			listNpmModules(function (_result) {
				result = _result;
				done();
			});
		});

		it('should return results from cache', function () {
			expect(result).toEqual(npmKeysCache.keys);
		});
	});
});
