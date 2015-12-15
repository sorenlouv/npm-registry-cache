var CACHE_FILENAME = './cache.json';
var _isFunction = require('lodash.isfunction');
var _defaults = require('lodash.defaults');
var fs = require('fs');
var request = require('request');
var npmKeysCache;

try {
    npmKeysCache = JSON.parse(fs.readFileSync(CACHE_FILENAME, 'utf8'));
} catch (e) {
    npmKeysCache = {};
}

function listNpmModules(options, callback) {
    if(_isFunction(options)) {
        callback = options;
        options = {};
    }
    options = _defaults(options, {
        forceUpdate: false,
        validity: 24 * 3600 * 1000
    });
    var expiryDate = (npmKeysCache.timestamp || 0) + options.validity;
    var isStale = Date.now() > expiryDate;

    if(!options.forceUpdate && !isStale) {
        console.info('Returning cached');
        callback(npmKeysCache.keys);
        return;
    }

    if(options.forceUpdate) {
        console.log('Force updating');
    }

    if(isStale) {
        console.log('Cache is stale');
    }

    var requestOptions = {
        url: 'http://registry.npmjs.org/-/all',
        json: true,
        gzip: true,
        headers: {
            'If-None-Match': npmKeysCache.etag
        }
    };

    function requestHandler(err, res, body) {
        var keys, etag;
        if (err) {
            console.error('Could not load npm modules', err);
            return;
        }

        switch(res.statusCode) {
            case 200:
                keys = Object.keys(body);
                etag = res.headers.etag;
                updateCache(keys, etag);
                callback(keys);
                break;
            case 304:
                updateCacheTimestamp();
                callback(npmKeysCache.keys);
                break;
            default:
                console.error('Unexpected status code', res.statusCode);
        }
    }

    request.get(requestOptions, requestHandler);
}

function updateCacheTimestamp() {
    updateCache(npmKeysCache.keys, npmKeysCache.etag);
}

function updateCache(keys, etag) {
    var filename = CACHE_FILENAME;
    var fileContent = {
        timestamp: Date.now(),
        etag: etag,
        keys: keys
    };
    fs.writeFile(filename, JSON.stringify(fileContent), function(err) {
        if (err) {
            console.error('Could not save cache', filename, err);
        }

        npmKeysCache = fileContent;
    });
}

module.exports = listNpmModules;

