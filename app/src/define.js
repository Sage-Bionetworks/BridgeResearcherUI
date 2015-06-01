/**
 * Very simple syntactic sugar for defining classes.
 * @param parent
 * @param methods
 */
module.exports = function(parent, methods) {
    if (arguments.length === 1) { // parent is optional
        methods = parent;
        parent = null;
    }
    var F = (methods.init || function() {});
    if (parent) {
        var C = function() {}; // don't call parent constructor
        C.prototype = parent.prototype;
        F.prototype = new C();
    }
    if (methods.properties) {
        for (var methName in methods.properties) {
            Object.defineProperty(F.prototype, methName, {
                enumerable: false,
                configurable: false,
                get: methods.properties[methName]
            });
        }
        delete methods.properties;
    }
    delete methods.init;
    for (var prop in methods) {
        F.prototype[prop] = methods[prop];
    }
    F.prototype.constructor = F;
    return F;
}