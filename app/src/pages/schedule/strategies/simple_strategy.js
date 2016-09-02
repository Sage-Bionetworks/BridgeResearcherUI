var ko = require('knockout');
var utils = require('../../../utils');
var root = require('../../../root');

module.exports = function(params) {
    var self = this;

    self.labelObs = params.labelObs;
    self.scheduleObs = ko.observable();
    self.scheduleObs.callback = utils.identity;

    params.strategyObs.callback = function () {
        var strategy = params.strategyObs();
        strategy.schedule = self.scheduleObs.callback();
        return strategy;
    };

    function initStrategy(strategy) {
        if (strategy && strategy.schedule) {
            setTimeout(function() {
                self.scheduleObs(strategy.schedule);
            }, 1);
            root.setEditorPanel('SimpleScheduleStrategyPanel', {viewModel:self});
        }
    }
    initStrategy(params.strategyObs());
    var subscription = params.strategyObs.subscribe(function(strategy) {
        initStrategy(strategy);
        subscription.dispose();
    });    
};