var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../../utils');
var scheduleUtils = require('../schedule_utils');
var criteriaUtils = require('../../../criteria_utils');
var root = require('../../../root');

function groupToObservables(group) {
    group.criteriaObs = ko.observable(group.criteria);
    group.scheduleObs = ko.observable();
    group.scheduleObs.callback = utils.identity;
    group.labelObs = ko.computed(function() {
        return criteriaUtils.label(group.criteriaObs());
    });
    setTimeout(function() {
        group.scheduleObs(group.schedule);
    }, 1);
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
    var self = this;

    self.labelObs = params.labelObs;
    self.strategyObs = params.strategyObs;
    self.collectionName = params.collectionName;
    self.scheduleCriteriaObs = ko.observableArray([]).publishOn("scheduleCriteriaChanges");
    self.scheduleCriteriaObs.subscribe(function(newValue) {
        console.log("Items are being (re)ordered, value is", newValue); 
    });

    params.strategyObs.callback = function () {
        var strategy = params.strategyObs();
        strategy.scheduleCriteria = self.scheduleCriteriaObs().map(observablesToGroup);
        return strategy;
    };

    root.setEditorPanel('CriteriaScheduleStrategyPanel', {viewModel:self});

    function initStrategy(strategy) {
        if (strategy && strategy.scheduleCriteria) {
            self.scheduleCriteriaObs(strategy.scheduleCriteria.map(groupToObservables));
            root.setEditorPanel('CriteriaScheduleStrategyPanel', {viewModel:self});
        }
    }
    initStrategy(params.strategyObs());
    var subscription = params.strategyObs.subscribe(function(strategy) {
        initStrategy(strategy);
        subscription.dispose();
    });    

    var scrollTo = utils.makeScrollTo(".schedulegroup-fieldset");
    self.fadeUp = utils.fadeUp();

    self.addCriteria = function(vm, event) {
        self.scheduleCriteriaObs.push(newGroup());
        scrollTo(self.scheduleCriteriaObs().length-1);
    };
    self.removeCriteria = utils.animatedDeleter(scrollTo, self.scheduleCriteriaObs);

    self.selectCriteria = function(group) {
        var index = self.scheduleCriteriaObs.indexOf(group);
        scrollTo(index);
    };

    ko.postbox.subscribe("scheduleCriteriaAdd", self.addCriteria);
    ko.postbox.subscribe("scheduleCriteriaRemove", self.removeCriteria);
    ko.postbox.subscribe("scheduleCriteriaSelect", self.selectCriteria);
};