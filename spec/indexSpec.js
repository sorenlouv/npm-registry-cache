var fs = require('fs');
var request = require('request');
var _ = require('lodash');
var RegistryCache = require('../index');
var registryMock = require('./registryMock.json');

describe('when cache is not stale', function () {
	beforeEach(function () {
		spyOn(RegistryCache.prototype, '_readCacheFile').and.returnValue({});
		spyOn(RegistryCache.prototype, '_isStale').and.returnValue(false);
		spyOn(RegistryCache.prototype, '_update');
		jasmine.clock().install();
		var registry = new RegistryCache({
			ttl: 500
		});
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it('should not call _update', function () {
		expect(RegistryCache.prototype._update).not.toHaveBeenCalled();
	});

	it('should update cache recuringly', function () {
		jasmine.clock().tick(1001);
		expect(RegistryCache.prototype._update.calls.count()).toBe(2);
	});
});

describe('when cache is stale', function () {
	var cacheFileContent;
	beforeEach(function () {
		cacheFileContent = {
			etag: 'myEtag',
			timestamp: 'myTimestamp',
			items: ['a', 'b', 'c']
		};
		spyOn(RegistryCache.prototype, '_readCacheFile').and.returnValue(cacheFileContent);
		spyOn(RegistryCache.prototype, '_isStale').and.returnValue(true);
	});

	describe('and mocking update', function () {
		beforeEach(function () {
			spyOn(RegistryCache.prototype, '_update');
			jasmine.clock().install();
			var registry = new RegistryCache({
				ttl: 500
			});
		});

		afterEach(function() {
			jasmine.clock().uninstall();
		});

		it('should call _update', function () {
			expect(RegistryCache.prototype._update).toHaveBeenCalled();
		});

		it('should update cache recuringly', function () {
			jasmine.clock().tick(1001);
			expect(RegistryCache.prototype._update.calls.count()).toBe(3);
		});
	});

	describe('and calling through update', function () {
		beforeEach(function () {
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

				new RegistryCache();
			});

			it('should update timestamp in cache file', function () {
				var fileContent = fs.writeFile.calls.argsFor(0)[1];
				expect(JSON.parse(fileContent)).toEqual({
					timestamp: jasmine.any(Number),
					etag: cacheFileContent.etag,
					items: cacheFileContent.items
				});
			});
		});

		describe('and registry returns 200', function () {
			describe('and no "field" argument is given', function () {
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

					new RegistryCache();
				});

				it('should download a fresh list', function () {
					expect(request.get).toHaveBeenCalled();
				});

				it('should update cache file', function () {
					expect(fs.writeFile).toHaveBeenCalledWith(
						jasmine.stringMatching(/caches\/[a-f0-9]{32}\.json$/),
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
							items: ['a', 'b', 'c']
						});
					}
				});
			});

			describe('and an array "fields" argument is given', function () {
				beforeEach(function () {
					spyOn(request, 'get').and.callFake(function (options, handler) {
						var err;
						var res = {
							statusCode: 200,
							headers: {
								etag: 'myEtag'
							}
						};
						var body = _.cloneDeep(registryMock);
						handler(err, res, body);
					});

					new RegistryCache({
						fields: ['name', 'version', 'homepage']
					});
				});

				it('should write the correct items', function () {
					var items = JSON.parse(fs.writeFile.calls.argsFor(0)[1]).items;
					expect(items).toEqual([{
						name: 'q',
						version: '1.4.1',
						homepage: 'https://github.com/kriskowal/q'
					}, {
						name: 'lodash',
						version: '3.10.1',
						homepage: 'https://lodash.com/'
					}, {
						name: 'request',
						version: '2.67.0',
						homepage: 'https://github.com/request/request#readme'
					}, {
						name: 'jquery',
						version: '2.1.4',
						homepage: 'http://jquery.com'
					}, {
						name: 'phantomjs',
						version: '1.9.19',
						homepage: 'https://github.com/Medium/phantomjs'
					}]);
				});
			});

			describe('and a function "fields" argument is given', function () {
				beforeEach(function () {
					spyOn(request, 'get').and.callFake(function (options, handler) {
						var err;
						var res = {
							statusCode: 200,
							headers: {
								etag: 'myEtag'
							}
						};
						var body = _.cloneDeep(registryMock);
						handler(err, res, body);
					});

					new RegistryCache({
						fields: function(item){
							return item.repository.url;
						}
					});
				});

				it('should write the correct items', function () {
					var items = JSON.parse(fs.writeFile.calls.argsFor(0)[1]).items;
					expect(items).toEqual([
						'git://github.com/kriskowal/q.git',
						'git+https://github.com/lodash/lodash.git',
						'git+https://github.com/request/request.git',
						'https://github.com/jquery/jquery.git',
						'git://github.com/Medium/phantomjs.git'
					]);
				});
			});
		});
	});
});

describe('when get is called', function () {
	var result, cacheFileContent;

	beforeEach(function () {
		cacheFileContent = {
			etag: 'myEtag',
			timestamp: 'myTimestamp',
			items: ['a', 'b', 'c']
		};
		spyOn(RegistryCache.prototype, '_readCacheFile').and.returnValue(cacheFileContent);
	});

	it('should return results', function () {
		var registry = new RegistryCache();
		expect(registry.get()).toEqual(cacheFileContent.items);
	});
});
