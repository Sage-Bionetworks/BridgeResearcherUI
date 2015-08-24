var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.cancel = function() {
        utils.closeDialog();
    };
};