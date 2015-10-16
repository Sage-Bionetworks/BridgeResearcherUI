var Promise = require('es6-promise').Promise;

var cache = {};

var isSessionKey = function() {
    // These keys are persisted long-term. The rest are just held in memory in one window.
    var sessionKeys = ['session','environment','studyKey'];
    return function(key) {
        return sessionKeys.indexOf(key) > -1;
    };
}
function set(key, value) {
    console.log("[cache] Setting", key);
    if (isSessionKey(key)) {
        localStorage.setItem(key, JSON.stringify(value));
    } else {
        cache[key] = JSON.stringify(value);
    }
}
function get(key) {
    var value = (isSessionKey(key)) ? localStorage.getItem(key) : cache[key];
    if (value === null) {
        return null;
    }
    console.log("[cache] Loading from cache", key);
    return JSON.parse(value);
}
function getPromise(key) {
    var value = get(key);
    return (value === null) ? value : Promise.resolve(value);
}
function remove(key) {
    console.log("[cache] Removing", key);
    if (isSessionKey(key)) {
        localStorage.removeItem(key);
    } else {
        delete cache[key];
    }
}
function removeAll() {
    console.log("[cache] Removing all items");
    localStorage.clear();
    cache = {};
}

module.exports = {
    set: set,
    get: get,
    /**
     * A convenience version of the get method that returns a promise if the value is found,
     * or null otherwise.
     * @param key
     * @returns a promise that returns the value, if it is found, or else null
     */
    getPromise: getPromise,
    remove: remove,
    removeAll: removeAll
};