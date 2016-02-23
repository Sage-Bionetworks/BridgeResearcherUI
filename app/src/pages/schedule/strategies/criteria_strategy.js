var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../../utils');
var scheduleUtils = require('../schedule_utils');
var criteriaUtils = require('../../../criteria_utils');
var serverService = require('../../../services/server_service');
var root = require('../../../root');

function groupToObservables(group) {
    group.minAppVersionObs = ko.observable(group.criteria.minAppVersion);
    group.maxAppVersionObs = ko.observable(group.criteria.maxAppVersion);
    group.allOfGroupsObs = ko.observableArray(group.criteria.allOfGroups);
    group.noneOfGroupsObs = ko.observableArray(group.criteria.noneOfGroups);
    group.scheduleObs = ko.observable(group.schedule);
    group.scheduleObs.callback = utils.identity;
    group.labelObs = ko.computed(function() {
        return criteriaUtils.label(group.criteria);
    });
    group.noneOfGroupsEditorObs = ko.observable();
    group.allOfGroupsEditorObs = ko.observable();

    group.addToNone = function() {
        var value = group.noneOfGroupsEditorObs();
        if (group.noneOfGroupsObs().indexOf(value) === -1) {
            group.noneOfGroupsObs.push(value);
        }
    };
    group.addToAll = function() {
        var value = group.allOfGroupsEditorObs();
        if (group.allOfGroupsObs().indexOf(value) === -1) {
            group.allOfGroupsObs.push(value);
        }
    };
    group.removeNoneOf = function(tag) {
        group.noneOfGroupsObs.remove(tag);
    };
    group.removeAllOf = function(tag) {
        group.allOfGroupsObs.remove(tag);
    };

    return group;
}

function observablesToGroup(group) {
    return {
        schedule: group.scheduleObs.callback(),
        criteria: {
            minAppVersion: parseInt(group.minAppVersionObs(), 10),
            maxAppVersion: parseInt(group.maxAppVersionObs(), 10),
            allOfGroups: group.allOfGroupsObs(),
            noneOfGroups: group.noneOfGroupsObs()
        },
        type: 'ScheduleCriteria'
    };
}

function newGroup() {
    var group = {
        criteria:{
            minAppVersion:null,
            maxAppVersion:null,
            allOfGroups:[],
            noneOfGroups:[]
        },
        schedule:scheduleUtils.newSchedule()
    };
    groupToObservables(group);
    return group;
}

module.exports = function(params) {
    var self = this;

    self.labelObs = params.labelObs;
    self.strategyObs = params.strategyObs;
    self.collectionName = params.collectionName;
    self.scheduleCriteriaObs = ko.observableArray([]).publishOn("scheduleCriteriaChanges");
    self.dataGroupsOptions = ko.observableArray([]);

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

    serverService.getStudy().then(function(study) {
        var array = study.dataGroups.map(function(value) {
            return {label: value, value:value};
        });
        self.dataGroupsOptions(array);
    });
};