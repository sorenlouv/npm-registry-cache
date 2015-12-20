var fs = require('fs');
var request = require('request');
var _ = require('lodash');
var NpmModules = require('../index');

describe('when cache is stale', function () {
	beforeEach(function () {
		spyOn(NpmModules.prototype, '_isStale').and.returnValue(true);
		spyOn(NpmModules.prototype, '_update');
		jasmine.clock().install();
		var npmModules = new NpmModules(500);
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it('should call _update', function () {
		expect(NpmModules.prototype._update).toHaveBeenCalled();
	});

	it('should update cache when it expires', function () {
		jasmine.clock().tick(1001);
		expect(NpmModules.prototype._update.calls.count()).toBe(3);
	});
});

describe('when cache is not stale', function () {
	beforeEach(function () {
		spyOn(NpmModules.prototype, '_isStale').and.returnValue(false);
		spyOn(NpmModules.prototype, '_update');
		jasmine.clock().install();
		var npmModules = new NpmModules(500);
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it('should not call _update', function () {
		expect(NpmModules.prototype._update).not.toHaveBeenCalled();
	});

	it('should update cache when it expires', function () {
		jasmine.clock().tick(1001);
		expect(NpmModules.prototype._update.calls.count()).toBe(2);
	});
});

describe('When cache is stale and "this._update" is called', function () {
	var cacheFileContent;
	beforeEach(function () {
		cacheFileContent = {
			etag: 'myEtag',
			timestamp: 'myTimestamp',
			keys: ['a', 'b', 'c']
		};
		spyOn(NpmModules.prototype, '_readCacheFile').and.returnValue(cacheFileContent);
		spyOn(NpmModules.prototype, '_isStale').and.returnValue(true);
		spyOn(fs, 'writeFile');
	});

	describe('and registry returns 304', function () {
		beforeEach(function () {
			spyOn(request, 'get').and.callFake(function (options, handler) {
				var err;
				var res = {
					statusCode: 304
				};
				var body = null;
				handler(err, res, body);
			});

			new NpmModules();
		});

		it('should update timestamp in cache file', function () {
			var fileContent = fs.writeFile.calls.argsFor(0)[1];
			expect(JSON.parse(fileContent)).toEqual({
				timestamp: jasmine.any(Number),
				etag: cacheFileContent.etag,
				keys: cacheFileContent.keys
			});
		});
	});

	describe('and registry returns 200', function () {
		beforeEach(function () {
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

			new NpmModules();
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
	});
});

describe('when get is called', function () {
	var result, cacheFileContent;

	beforeEach(function () {
		cacheFileContent = {
			etag: 'myEtag',
			timestamp: 'myTimestamp',
			keys: ['a', 'b', 'c']
		};
		spyOn(NpmModules.prototype, '_readCacheFile').and.returnValue(cacheFileContent);
	});

	it('should return results', function () {
		var npmModules = new NpmModules();
		expect(npmModules.get()).toEqual(cacheFileContent.keys);
	});
});
