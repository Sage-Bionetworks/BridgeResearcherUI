const LOG_CACHE = false;
const NO_CACHE_PATHS = ['studies/self/emailStatus','/participants','externalIds?'];

function matchesNoCachePath(path) {
    return NO_CACHE_PATHS.some(function(matchPath) {
        return path.indexOf(matchPath) > -1;
    });
}

export default class Cache {
    constructor() {
        this.cachedItems = {};
    }
    get(key) {
        let value = this.cachedItems[key];
        if (LOG_CACHE) { 
            console.info((value) ? "[json cache] hit" : "[json cache] miss", key); 
        }
        return (value) ? JSON.parse(value) : null;
    }
    set(key, response) {
        if (!matchesNoCachePath(key)) {
            if (LOG_CACHE) { 
                console.info("[json cache] caching", key); 
            }
            this.cachedItems[key] = JSON.stringify(response);
        } else {
            if (LOG_CACHE) { 
                console.warn("[json cache] do not cache", key); 
            }
        }
    }
    clear(key) {
        // clear everything, this is now a fetch cache. Very simple, hard to screw up.
        this.cachedItems = {};
    }
    reset() {
        this.cachedItems = {};
    }
}
