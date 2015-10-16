var Promise = require('es6-promise').Promise;

module.exports = {
    set: function(key, value) {
        console.log("[persist] Setting", key);
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key, defaultValue) {
        var value = localStorage.getItem(key);
        if (value) {
            console.log("[persist] Loading", key);
            return JSON.parse(value);
        }
        if (arguments.length > 1) {
            console.log("[persist] Returning default", defaultValue);
            return defaultValue;
        }
        return null;
    },
    /**
     * A convenience version of the get method that returns a promise if the value is found,
     * or null otherwise.
     * @param key
     * @returns a promise that returns the value, if it is found, or else null
     */
    getPromise: function(key) {
        var value = localStorage.getItem(key);
        if (value) {
            console.log("[persist] Loading promise", key);
            return Promise.resolve(JSON.parse(value));
        }
        return null;
    },
    remove: function(key) {
        console.log("[persist] Removing", key);
        localStorage.removeItem(key);
    },
    removeAll: function() {
        console.log("[persist] Removing all items");
        localStorage.clear();
    }
};