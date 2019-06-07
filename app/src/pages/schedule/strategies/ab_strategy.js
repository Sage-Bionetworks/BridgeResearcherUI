import fn from "../../../functions";
import ko from "knockout";
import root from "../../../root";
import scheduleUtils from "../schedule_utils";
import utils from "../../../utils";

function groupToObservables(group) {
  group.percentageObs = ko.observable(group.percentage);
  group.scheduleObs = ko.observable();
  setTimeout(function() {
    group.scheduleObs(group.schedule);
  }, 10);
  group.scheduleObs.callback = fn.identity;
  group.percentLabel = ko.computed(function() {
    return group.percentageObs() + "%";
  });
  return group;
}

function observablesToGroup(group) {
  return {
    percentage: parseInt(group.percentageObs(), 10),
    schedule: group.scheduleObs.callback(),
    type: "ScheduleGroup"
  };
}

function newGroup() {
  let group = { percentage: 0, schedule: scheduleUtils.newSchedule() };
  groupToObservables(group);
  return group;
}

export default function(params) {
  let self = this;

  self.labelObs = params.labelObs;
  self.scheduleGroupsObs = ko.observableArray([]);
  self.collectionName = params.collectionName;
  self.selectedElementObs = ko.observable(0);

  params.strategyObs.subscribe(updateObservers);
  updateObservers(params.strategyObs());

  function updateObservers(strategy) {
    if (strategy && strategy.scheduleGroups) {
      self.scheduleGroupsObs(strategy.scheduleGroups.map(groupToObservables));
      root.setEditorPanel("ABTestScheduleStrategyPanel", { viewModel: self });
    }
  }

  params.strategyObs.callback = function() {
    let strategy = params.strategyObs();
    strategy.scheduleGroups = self.scheduleGroupsObs().map(observablesToGroup);
    return strategy;
  };

  let scrollTo = utils.makeScrollTo(".schedulegroup-fieldset");
  self.fadeUp = utils.fadeUp();

  self.addGroup = function(vm, event) {
    self.scheduleGroupsObs.push(newGroup());
    scrollTo(self.scheduleGroupsObs().length - 1);
  };
  self.removeGroup = utils.animatedDeleter(scrollTo, self.scheduleGroupsObs);
  self.selectGroup = function(group) {
    let index = self.scheduleGroupsObs.indexOf(group);
    scrollTo(index);
  };
};
