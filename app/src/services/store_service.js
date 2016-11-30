var transforms = require('../transforms');

localStorage.removeItem('participants-page');

module.exports = {
    set: function(key, value) {
        console.log("[cache] Setting", key);
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key) {
        var value = localStorage.getItem(key);
        if (typeof value !== "string") {
            return null;
        }
        console.log("[cache] Loading from cache", key);
        return JSON.parse(value);
    },
    remove: function(key) {
        localStorage.removeItem(key);
    },
    persistQuery: function(key, object) {
        var queryString = transforms.queryString(object);
        localStorage.setItem(key, queryString);
        var url = document.location.pathname + queryString + document.location.hash;
        window.history.replaceState(null, null, url);
    },
    restoreQuery: function(key) {
        var stored = null;
        if (document.location.search) {
            stored = document.location.search;
        } else if (localStorage.getItem(key)) {
            stored = localStorage.getItem(key);
        }
        if (stored) {
            var pairs = stored.substring(1).split("&");
            return pairs.reduce(function(obj, pair) {
                var keyPair = pair.split("=");
                obj[decodeURIComponent(keyPair[0])] = decodeURIComponent(keyPair[1]);
                return obj;
            }, {});
        }
        return {};
    }
};