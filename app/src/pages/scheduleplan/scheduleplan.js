var ko = require('knockout');
var serverService = require('../../services/server_service');
var scheduleUtils = require('./../schedule/schedule_utils');
var utils = require('../../utils');

/**
 * The complexity of this view comes from the fact that the entire data model is in the strategy,
 * and the strategy can entirely change the data model.
 * @param params
 */
module.exports = function(params) {
    var self = this;

    self.plan = null;

    // Models for the strategy object. The callback function will be called when saving the
    // schedule plan; the strategy implementation must implement this callback to return a
    // strategy object
    self.strategyObs = ko.observable();
    self.strategyObs.callback = utils.identity;

    // Fields for this form
    self.labelObs = ko.observable("");
    self.minAppVersionObs = ko.observable("");
    self.maxAppVersionObs = ko.observable("");
    self.schedulePlanTypeOptions = scheduleUtils.TYPE_OPTIONS;
    self.schedulePlanTypeLabel = utils.makeOptionLabelFinder(scheduleUtils.TYPE_OPTIONS);
    self.schedulePlanTypeObs = ko.observable('SimpleScheduleStrategy');
    self.schedulePlanTypeObs.subscribe(function(newValue) {
        if (newValue === 'SimpleScheduleStrategy') {
            self.strategyObs(scheduleUtils.newSimpleStrategy());
        } else if (newValue === 'ABTestScheduleStrategy') {
            self.strategyObs(scheduleUtils.newABTestStrategy());
        } else if (newValue === 'CriteriaScheduleStrategy') {
            self.strategyObs(scheduleUtils.newCriteriaStrategy());
        }
    });

    self.save = function(vm, event) {
        self.plan.label = self.labelObs();
        self.plan.strategy = self.strategyObs.callback();
        self.plan.minAppVersion = self.minAppVersionObs();
        self.plan.maxAppVersion = self.maxAppVersionObs();

        utils.deleteUnusedProperties(self.plan);

        utils.startHandler(self, event);
        serverService.saveSchedulePlan(self.plan)
            .then(utils.successHandler(self, event, "The schedule plan has been saved."))
            .then(function(response) {
                self.plan.guid = response.guid;
                self.plan.version = response.version;
                return response;
            })
            .catch(utils.failureHandler(self, event));
    };
    self.updateType = function(vm, event) {
        var spType = event.target.getAttribute('data-type');
        if (spType) {
            self.schedulePlanTypeObs(event.target.getAttribute('data-type'));
        }
    }

    function loadVM(plan) {
        self.plan = plan;
        self.labelObs(plan.label);
        self.schedulePlanTypeObs(plan.strategy.type);
        self.minAppVersionObs(plan.minAppVersion);
        self.maxAppVersionObs(plan.maxAppVersion);
        self.strategyObs(plan.strategy);
    }

    var notFoundHandler = utils.notFoundHandler(self, "Schedule plan not found.", "#/scheduleplans");

    if (params.guid !== "new") {
        serverService.getSchedulePlan(params.guid).then(loadVM).catch(notFoundHandler);
    } else {
        loadVM(scheduleUtils.newSchedulePlan());
    }
}