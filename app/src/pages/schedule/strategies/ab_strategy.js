var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../../utils');
var scheduleUtils = require('../schedule_utils');

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
    var group = {percentage:0, schedule:scheduleUtils.newSchedule()};
    groupToObservables(group);
    return group;
}

module.exports = function(params) {
    var self = this;

    self.strategyObs = params.strategyObs;
    self.scheduleGroupsObs = ko.observableArray([]).publishOn("scheduleGroupChanges");
    self.publishedObs = ko.observable(false);

    params.strategyObs.callback = function () {
        var strategy = params.strategyObs();
        strategy.scheduleGroups = self.scheduleGroupsObs().map(observablesToGroup);
        return strategy;
    };

    // This is fired when the parent viewModel gets a plan back from the server
    ko.computed(function () {
        var strategy = params.strategyObs();
        if (strategy && strategy.scheduleGroups) {
            self.scheduleGroupsObs(strategy.scheduleGroups.map(groupToObservables));
        }
    });

    function scrollTo(index) {
        var target = document.querySelectorAll(".schedulegroup-fieldset")[index];
        $(".scrollbox").animate({scrollTop: $(target).position().top+170})
    }

    self.addGroup = function(vm, event) {
        self.scheduleGroupsObs.push(newGroup());
        scrollTo(self.scheduleGroupsObs().length-1);
    };

    // These are triggered by the panel editor.
    ko.postbox.subscribe("scheduleGroupAdd", function() {
        self.scheduleGroupsObs.push(newGroup());
        setTimeout(function() {
            scrollTo(self.scheduleGroupsObs().length-1);
        },1);
    });
    ko.postbox.subscribe("scheduleGroupRemove", function(group) {
        self.scheduleGroupsObs.remove(group);
    });
    ko.postbox.subscribe("scheduleGroupSelect", function(group) {
        var index = self.scheduleGroupsObs().indexOf(group);
        scrollTo( index );
    });
};
