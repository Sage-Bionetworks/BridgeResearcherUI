var utils = require('../../utils');

module.exports = function(params) {
    var self = this;
    var parent = params.parentViewModel;
    var rules = parent.element.constraints.enumeration ||[];

    self.cancel = function() {
        utils.closeDialog();
    };
};