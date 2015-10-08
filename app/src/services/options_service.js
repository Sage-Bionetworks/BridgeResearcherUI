module.exports = {
    set: function(key, value) {
        console.log("Saving", key);
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key, defaultValue) {
        console.log("Retrieving", key);
        var value = localStorage.getItem(key);
        if (value) {
            console.log("Retrieving", key);
            return JSON.parse(value);
        }
        if (arguments.length > 1) {
            console.log("Retrieving default", defaultValue);
            return defaultValue;
        }
        return null;
    },
    remove: function(key) {
        console.log("Removing", key);
        localStorage.removeItem(key);
    },
    removeAll: function() {
        console.log("Removing all items");
        localStorage.clear();
    }
};