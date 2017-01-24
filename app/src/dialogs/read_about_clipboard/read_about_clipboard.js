var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.close = function(vm, event) {
        root.closeDialog();
    };
};
