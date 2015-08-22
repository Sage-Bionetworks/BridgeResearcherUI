var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.cancel = function() {
        utils.eventbus.emit('dialogs', 'sign_in_dialog');
    };
};