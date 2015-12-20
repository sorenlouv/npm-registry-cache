var CACHE_FILENAME = './cache.json';
var _isFunction = require('lodash.isfunction');
var _defaults = require('lodash.defaults');
var fs = require('fs');
var request = require('request');
var cacheFileContent = getCacheFileContent();

function listNpmModules(options, callback) {
    if(_isFunction(options)) {
        callback = options;
        options = {};
    }

    options = _defaults(options, {
        forceUpdate: false,
        validity: 24 * 3600 * 1000
    });

    var isStale = listNpmModules._isStale(cacheFileContent.timestamp, options.validity);
    if(!options.forceUpdate && !isStale) {
        callback(cacheFileContent.keys);
        return;
    }

    var requestOptions = {
        url: 'http://registry.npmjs.org/-/all',
        json: true,
        gzip: true,
        headers: {
            'If-None-Match': cacheFileContent.etag
        }
    };

    function requestHandler(err, res, responseBody) {
        var keys, etag;
        if (err) {
            console.error('Could not load npm modules', err);
            return;
        }
        switch(res.statusCode) {
            case 200:
                keys = Object.keys(responseBody);
                etag = res.headers.etag;
                updateCache(keys, etag);
                callback(keys);
                break;
            case 304:
                updateCacheTimestamp();
                callback(cacheFileContent.keys);
                break;
            default:
                console.error('Unexpected status code', res.statusCode);
        }
    }

    request.get(requestOptions, requestHandler);
}

function updateCacheTimestamp() {
    updateCache(cacheFileContent.keys, cacheFileContent.etag);
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
            return;
        }

        cacheFileContent = fileContent;
    });
}

function getCacheFileContent() {
    try {
        return JSON.parse(fs.readFileSync(CACHE_FILENAME, 'utf8'));
    } catch (e) {
        return {};
    }
}

listNpmModules._isStale = function (cacheTimestamp, validity) {
    var expiryDate = (cacheTimestamp || 0) + validity;
    var isStale = Date.now() > expiryDate;
    return isStale;
};

listNpmModules._setCache = function (cache) {
    cacheFileContent = cache;
};

module.exports = listNpmModules;

