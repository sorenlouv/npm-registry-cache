var CACHE_FILENAME = './cache.json';
var fs = require('fs');
var request = require('request');

function npmModules(ttl){
    ttl = ttl || 1000 * 3600 * 24;
    this.cacheFileContent = this._readCacheFile();
    var isStale = this._isStale(this.cacheFileContent.timestamp, ttl);
    if(isStale) {
        this._update();
    }

    if(ttl > 0) {
        setInterval(this._update, ttl);
    }
}

npmModules.prototype._update = function () {
    var _this = this;
    var requestOptions = {
        url: 'http://registry.npmjs.org/-/all',
        json: true,
        gzip: true,
        headers: {
            'If-None-Match': this.cacheFileContent.etag
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
                _this._persistCache(keys, etag);
                break;
            case 304:
                _this._persistCacheTimestamp();
                break;
            default:
                console.error('Unexpected status code', res.statusCode);
        }
    }

    request.get(requestOptions, requestHandler);
};

npmModules.prototype.get = function() {
    return this.cacheFileContent.keys;
};

npmModules.prototype.forceUpdate = function() {
    return this._update();
};

npmModules.prototype._isStale = function (cacheTimestamp, validity) {
    var expiryDate = (cacheTimestamp || 0) + validity;
    var isStale = Date.now() > expiryDate;
    return isStale;
};

npmModules.prototype._persistCacheTimestamp = function() {
    this._persistCache(this.cacheFileContent.keys, this.cacheFileContent.etag);
};

npmModules.prototype._persistCache = function(keys, etag) {
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

        this.cacheFileContent = fileContent;
    });
};

npmModules.prototype._readCacheFile = function() {
    try {
        return JSON.parse(fs.readFileSync(CACHE_FILENAME, 'utf8'));
    } catch (e) {
        return {};
    }
};

module.exports = npmModules;

