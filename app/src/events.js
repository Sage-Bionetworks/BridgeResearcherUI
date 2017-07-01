// This is https://www.npmjs.com/package/le-emitter
// Rewritten to ES5, changed case of variables, trimmed a bit.
// As released it doesn't work with webpack.

function validate(event, callback){
    if(typeof event !== 'string' || typeof callback !== 'function'){
        throw new Error("Invalid Arguments");
    }
    this.events[event] = this.events[event] || [];
}

export default class EventEmitter {
    constructor() {
        this.events = {};
    }
    addEventListener(event, callback        ) {
        validate.call(this, event, callback);
        this.events[event].push(callback);
        return this;
    }
    once(event, callback) {
        validate.call(this, event, callback);
        this.events[event].push(function callee() {
            this.off(event, callee); // clever
            callback.apply(this, arguments);
        }.bind(this));
        return this;
    }
    removeEventListener(event, callback){
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
    }
    emit(event){
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