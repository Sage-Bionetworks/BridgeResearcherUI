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
    }
};