// This is https://www.npmjs.com/package/le-emitter
// Rewritten to ES5, changed case of variables, trimmed a bit.
// As released it doesn't work with webpack.

function validate(event, callback){
    if(typeof event !== 'string' || typeof callback !== 'function'){
        throw new Error("Invalid Arguments");
    }
    this.events[event] = this.events[event] || [];
}

function EventEmitter() {
    this.events = {};
}
EventEmitter.prototype = {
    on: function(event, callback) {
        validate.call(this, event, callback);
        this.events[event].push(callback);
        return this;
    },
    once: function(event, callback) {
        validate.call(this, event, callback);
        this.events[event].push(function callee() {
            this.off(Event, callee); // clever
            callback.apply(this, arguments);
        }, this);
        return this;
    },
    off: function(event, callback){
        if(typeof event !== 'string') {
            throw new Error("Invalid Arguments");
        }
        if (this.events[event]) {
            if(typeof callback === 'function'){
                var index = this.events[event].indexOf(callback);
                if(index !== -1){
                    this.events[event].splice(index, 1);
                }
            } else if(typeof callback === 'undefined') {
                this.events[event] = [];
            }
        }
        return this;
    },
    emit: function(event){
        if(typeof event !== 'string') {
            throw new Error("Invalid Arguments");
        }
        if (this.events[event]) {
            var args = Array.prototype.slice.call(arguments,1);
            this.events[event].forEach(function(callback) {
                callback.apply(this, args);
            }, this);
        }
        return this;
    }
};
// TODO: Lost these by renaming as appropriate.
EventEmitter.prototype.addEventListener = EventEmitter.prototype.on;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;
EventEmitter.prototype.removeEventListener = EventEmitter.prototype.off;
EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

module.exports = EventEmitter;