// For reasons known only to Bluebird, Bluebird's Promise.resolve() is not working in tests.
// So stub out something idiotically simple.

var Promise = function(value) {
    this.value = value;
    this.exception = null;
}
Promise.prototype = {
    then: function(func) {
        try {
            return new Promise(func(this.value));
        } catch(e) {
            this.exception = e; 
            return this;
        }
    },
    catch: function(func) {
        if (this.exception) {
            func(this.exception);
        }
    }
}

module.exports = Promise;