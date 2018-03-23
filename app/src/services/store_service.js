import fn from '../functions';

// This has to be here so that these filter values can be removed in the url to update the page.
// This is very hacky...
localStorage.removeItem('participants-page');

export default {
    set: function(key, value) {
        console.debug("[cache] Setting", key);
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key) {
        let value = localStorage.getItem(key);
        if (typeof value !== "string") {
            console.debug("[cache] Load miss from cache", key);
            return null;
        }
        console.debug("[cache] Loading from cache", key);
        try {
            return JSON.parse(value);
        } catch(e) {
            return null;
        }
    },
    remove: function(key) {
        localStorage.removeItem(key);
    },
    persistQuery: function(key, object) {
        let queryString = fn.queryString(object);
        localStorage.setItem(key, queryString);
        let url = document.location.pathname + queryString + document.location.hash;
        window.history.replaceState(null, null, url);
    },
    restoreQuery: function(key) {
        let stored = null;
        if (document.location.search) {
            stored = document.location.search;
        } else if (localStorage.getItem(key)) {
            stored = localStorage.getItem(key);
        }
        if (stored) {
            let pairs = stored.substring(1).split("&");
            return pairs.reduce(function(obj, pair) {
                let keyPair = pair.split("=");
                obj[decodeURIComponent(keyPair[0])] = decodeURIComponent(keyPair[1]);
                return obj;
            }, {});
        }
        return {};
    }
};