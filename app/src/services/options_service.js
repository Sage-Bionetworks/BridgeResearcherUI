module.exports = {
    set: function(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key, defaultValue) {
        var value = sessionStorage.getItem(key);
        if (value) {
            return JSON.parse(value);
        }
        if (arguments.length > 1) {
            return defaultValue;
        }
        throw new Error("User option '"+key+"' not set.");
    },
    remove: function(key) {
        sessionStorage.removeItem(key);
    }
};