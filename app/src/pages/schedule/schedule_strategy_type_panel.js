var ko = require('knockout');

// This just supports loading the correct editor based on a strategy, after
// it is set via root. The sub-panels use pub/sub to get data from the view
// that drives this panel.
module.exports = function(params) {
    var self = this;

    self.labelObs = params.viewModel.labelObs;
    self.schedulePlanTypeObs = params.viewModel.schedulePlanTypeObs;

    self.panelContentObs = ko.observable();
    ko.computed(function() {
        var type = params.viewModel.schedulePlanTypeObs();
        self.panelContentObs({
            name: type+"Panel",
            params: {"viewModel": params.viewModel}
        });
    });
};
