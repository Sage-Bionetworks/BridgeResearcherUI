var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../../utils');
var scheduleUtils = require('../schedule_utils');
var serverService = require('../../../services/server_service');

function groupToObservables(group) {
    group.minAppVersionObs = ko.observable(group.minAppVersion);
    group.maxAppVersionObs = ko.observable(group.maxAppVersion);
    group.allOfGroupsObs = ko.observableArray(group.allOfGroups);
    group.noneOfGroupsObs = ko.observableArray(group.noneOfGroups);
    group.scheduleObs = ko.observable(group.schedule);
    group.scheduleObs.callback = utils.identity;
    group.publishedObs = ko.observable(false);

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
        minAppVersion: parseInt(group.minAppVersionObs(), 10),
        maxAppVersion: parseInt(group.maxAppVersionObs(), 10),
        allOfGroups: group.allOfGroupsObs(),
        noneOfGroups: group.noneOfGroupsObs(),
        schedule: group.scheduleObs.callback(),
        type: 'ScheduleCriteria'
    };
}

function newGroup() {
    var group = {minAppVersion:0, maxAppVersion:0, allOfGroups:[], noneOfGroups:[], schedule:scheduleUtils.newSchedule()};
    groupToObservables(group);
    return group;
}

module.exports = function(params) {
    var self = this;

    self.strategyObs = params.strategyObs;
    self.scheduleCriteriaObs = ko.observableArray([]);
    self.publishedObs = ko.observable(false);
    self.dataGroupsOptions = ko.observableArray([]);

    params.strategyObs.callback = function () {
        var strategy = params.strategyObs();
        strategy.scheduleCriteria = self.scheduleCriteriaObs().map(observablesToGroup);
        return strategy;
    };

    // This is fired when the parent viewModel gets a plan back from the server
    ko.computed(function () {
        var strategy = params.strategyObs();
        if (strategy && strategy.scheduleCriteria) {
            self.scheduleCriteriaObs(strategy.scheduleCriteria.map(groupToObservables));
        }
    });

    ko.postbox.subscribe("scheduleCriteriaAdd", function() {
        self.scheduleCriteriaObs.push(newGroup());
    });
    ko.postbox.subscribe("scheduleCriteriaRemove", function(group) {
        self.scheduleCriteriaObs.remove(group);
    });
    ko.postbox.subscribe("scheduleCriteriaSelect", function(group) {
        var index = self.scheduleCriteriaObs().indexOf(group);

        // pretty junky magic number stuff going on here.
        var target = document.querySelectorAll(".schedulegroup-fieldset")[index];
        var pos = $(target).position().top + 190;
        $(".scrollbox").animate({scrollTop: pos});
    });
    serverService.getStudy().then(function(study) {
        var array = study.dataGroups.map(function(value) {
            return {label: value, value:value};
        });
        self.dataGroupsOptions(array);
    });
};