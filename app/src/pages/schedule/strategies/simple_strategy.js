import fn from "../../../functions";
import ko from "knockout";
import root from "../../../root";

module.exports = function(params) {
  let self = this;

  self.labelObs = params.labelObs;
  self.scheduleObs = ko.observable();
  self.scheduleObs.callback = fn.identity;

  params.strategyObs.callback = function() {
    let strategy = params.strategyObs();
    strategy.schedule = self.scheduleObs.callback();
    return strategy;
  };

  params.strategyObs.subscribe(function(strategy) {
    if (strategy && strategy.schedule) {
      setTimeout(function() {
        self.scheduleObs(strategy.schedule);
      }, 1);
      root.setEditorPanel("SimpleScheduleStrategyPanel", { viewModel: self });
    }
  });
};
