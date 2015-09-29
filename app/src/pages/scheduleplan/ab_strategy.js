var ko = require('knockout');
var utils = require('../../utils');
var scheduleService = require('../../services/schedule_service.js');
var $ = require('jquery');

function groupToObservables(group) {
    group.percentageObs = ko.observable(group.percentage);
    group.scheduleObs = ko.observable(group.schedule);
    group.scheduleObs.callback = utils.identity;
    group.publishedObs = ko.observable(false);
    group.percentLabel = ko.computed(function(){
        return group.percentageObs()+"%";
    });
    return group;
}

function observablesToGroup(group) {
    return {
        percentage: parseInt(group.percentageObs(), 10),
        schedule: group.scheduleObs.callback(),
        type: 'ScheduleGroup'
    };
}

function newGroup() {
    var group = {percentage:0, schedule:scheduleService.newSchedule()};
    groupToObservables(group);
    return group;
}

module.exports = function(params) {
    var self = this;

    self.strategyObs = params.strategyObs;
    self.scheduleGroupsObs = ko.observableArray([]);
    self.publishedObs = ko.observable(false);

    params.strategyObs.callback = function () {
        var strategy = params.strategyObs();
        strategy.scheduleGroups = self.scheduleGroupsObs().map(observablesToGroup);
        return strategy;
    };

    // This is fired when the parent viewModel gets a plan back from the server
    ko.pureComputed(function () {
        var strategy = params.strategyObs();
        self.scheduleGroupsObs(strategy.scheduleGroups.map(groupToObservables));
    });

    self.addGroup = function(vm, event) {
        self.scheduleGroupsObs.push(newGroup());
    };
    self.removeGroup = function(vm, event) {
        event.preventDefault();
        if (confirm("You are about to a schedule group.\n\n Are you sure?")) {
            var context = ko.contextFor(event.target);
            var $element = $(event.target).closest(".schedulegroup-fieldset");
            $element.css("max-height","0px");
            setTimeout(function() {
                self.scheduleGroupsObs.remove(context.$data);
                $element.remove();
            },510);
        }
    };
};
