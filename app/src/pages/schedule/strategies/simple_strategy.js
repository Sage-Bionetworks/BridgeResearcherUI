import * as ko from 'knockout';
import * as fn from '../../../functions';
import root from '../../../root';

module.exports = function(params) {
    var self = this;

    self.labelObs = params.labelObs;
    self.scheduleObs = ko.observable();
    self.scheduleObs.callback = fn.identity;

    params.strategyObs.callback = function () {
        var strategy = params.strategyObs();
        strategy.schedule = self.scheduleObs.callback();
        return strategy;
    };

    var subscription = params.strategyObs.subscribe(function(strategy) {
        if (strategy && strategy.schedule) {
            setTimeout(function() {
                self.scheduleObs(strategy.schedule);
            }, 1);
            root.setEditorPanel('SimpleScheduleStrategyPanel', {viewModel:self});
            subscription.dispose();
        }
    });    
};