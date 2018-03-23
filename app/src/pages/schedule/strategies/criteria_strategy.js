import criteriaUtils from '../../../criteria_utils';
import fn from '../../../functions';
import ko from 'knockout';
import root from '../../../root';
import scheduleUtils from '../schedule_utils';
import utils from '../../../utils';

function groupToObservables(group) {
    group.criteriaObs = ko.observable(group.criteria);
    group.scheduleObs = ko.observable(group.schedule);
    group.scheduleObs.callback = fn.identity;
    group.labelObs = ko.computed(function() {
        return criteriaUtils.label(group.criteriaObs());
    });
    return group;
}

function observablesToGroup(group) {
    return {
        criteria: group.criteriaObs(),
        schedule: group.scheduleObs.callback(),
        type: 'ScheduleCriteria'
    };
}

function newGroup() {
    return groupToObservables({
        criteria: criteriaUtils.newCriteria(),
        schedule: scheduleUtils.newSchedule()
    });
}

module.exports = function(params) {
    let self = this;

    self.labelObs = params.labelObs;
    self.strategyObs = params.strategyObs;
    self.collectionName = params.collectionName;
    self.scheduleCriteriaObs = ko.observableArray([]);
    self.selectedElementObs = ko.observable(0);
    
    params.strategyObs.callback = function () {
        let strategy = params.strategyObs();
        strategy.scheduleCriteria = self.scheduleCriteriaObs().map(observablesToGroup);
        return strategy;
    };

    root.setEditorPanel('CriteriaScheduleStrategyPanel', {viewModel:self});

    params.strategyObs.subscribe(function(strategy) {
        if (strategy && strategy.scheduleCriteria) {
            self.scheduleCriteriaObs(strategy.scheduleCriteria.map(groupToObservables));
            root.setEditorPanel('CriteriaScheduleStrategyPanel', {viewModel:self});
        }
    });    

    let scrollTo = utils.makeScrollTo(".schedulegroup-fieldset");
    self.fadeUp = utils.fadeUp();

    self.addCriteria = function(vm, event) {
        self.scheduleCriteriaObs.push(newGroup());
        scrollTo(self.scheduleCriteriaObs().length-1);
    };
    self.removeCriteria = utils.animatedDeleter(scrollTo, self.scheduleCriteriaObs);

    self.selectCriteria = function(group) {
        let index = self.scheduleCriteriaObs.indexOf(group);
        scrollTo(index);
    };
};