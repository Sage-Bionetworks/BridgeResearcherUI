var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../../utils');
var scheduleUtils = require('../schedule_utils');
var criteriaUtils = require('../../../criteria_utils');
var serverService = require('../../../services/server_service');
var root = require('../../../root');

function groupToObservables(group) {
    console.log( "groupToObservables", group.criteria );

    console.log("so does it exist?",group.criteriaObs);

    group.criteriaObs = ko.observable(group.criteria);
    group.criteriaObs.criteriaCallback = utils.identity;
    
    group.scheduleObs = ko.observable(group.schedule);
    group.scheduleObs.callback = utils.identity;

    group.labelObs = ko.computed(function() {
        return criteriaUtils.label(group.criteria);
    });
    return group;
}

function observablesToGroup(group) {
    console.log( "observablesToGroup", group.criteriaObs.criteriaCallback() );
    return {
        criteria: group.criteriaObs.criteriaCallback(),
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

    params.strategyObs.callback = function () {
        var strategy = params.strategyObs();
        strategy.scheduleCriteria = self.scheduleCriteriaObs().map(observablesToGroup);
        return strategy;
    };

    root.setEditorPanel('CriteriaScheduleStrategyPanel', {viewModel:self});

    // This is fired when the parent viewModel gets a plan back from the server
    ko.computed(function () {
        var strategy = params.strategyObs();
        if (strategy && strategy.scheduleCriteria) {
            console.log("strategy.scheduleCriteria",strategy.scheduleCriteria);
            self.scheduleCriteriaObs(strategy.scheduleCriteria.map(groupToObservables));
        }
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