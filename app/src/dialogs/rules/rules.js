var ko = require('knockout');
var utils = require('../../utils');

module.exports = function(params) {
    var self = this;
    var parent = params.parentViewModel;
    var rules = parent.element.constraints.rules ||[];

    self.rulesObs = ko.observableArray(rules);

    self.cancel = function() {
        utils.closeDialog();
    };
};