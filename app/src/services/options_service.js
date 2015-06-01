module.exports = {
    set: function(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key, defaultValue) {
        var value = sessionStorage.getItem(key);
        if (value) {
            return JSON.parse(value);
        }
        if (defaultValue) {
            return defaultValue;
        }
        throw new Error("User option '"+key+"' not set.");
    }
};