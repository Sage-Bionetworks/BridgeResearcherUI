var ko = require('knockout');
var serverService = require('../../services/server_service.js');
var utils = require('../../utils');

var TYPE_OPTIONS = Object.freeze([
    {value: 'SimpleScheduleStrategy', label: 'Simple Schedule'},
    {value: 'ABTestScheduleStrategy', label: 'A/B Test Schedule'}
]);
var SCHEDULE_FIELDS = ['scheduleType','eventId','delay','interval',
    'expires','cronTrigger','startsOn','endsOn','times','activities'];

function newSchedulePlan() {
    return {
        type: 'SchedulePlan',
        label: "",
        strategy: {
            schedule: {
                scheduleType: 'once', eventId:null, delay:null, interval:null, expires:null,
                cronTrigger:null, startsOn:null, endsOn:null, times:[], activities:[]
            },
            type: 'SimpleScheduleStrategy'
        }
    };
}

/**
 * The complexity of this view comes from the fact that the entire data model is in the strategy,
 * and the strategy can entirely change the data model.
 * @param params
 */
module.exports = function(params) {
    var self = this;

    self.plan = null;
    self.messageObs = ko.observable();
    self.publishedObs = ko.observable(false);

    // This object is passed to the sub-component views, which are solely responsible for implementing
    // an editor for the strategy, and providng a callback to get it.
    self.delegate = {
        strategy: utils.identity
    };
    // To pass the strategy to sub-component views once it is loaded.
    self.strategyObs = ko.observable();

    // Fields for this form
    self.labelObs = ko.observable("");
    self.schedulePlanTypeObs = ko.observable('SimpleSchedulePlan');
    self.schedulePlanTypeOptions = TYPE_OPTIONS;
    self.schedulePlanTypeLabel = utils.makeFinderByLabel(TYPE_OPTIONS);

    self.save = function(vm, event) {
        self.plan.label = self.labelObs();
        self.plan.strategy = self.delegate.strategy();

        utils.deleteUnusedProperties(self.plan);
        console.log(JSON.stringify(self.plan));

        utils.startHandler(self, event);
        serverService.saveSchedulePlan(self.plan)
            .then(utils.successHandler(self, event, "The schedule plan has been saved."))
            .then(function(response) {
                self.plan.guid = response.guid;
                self.plan.version = response.version;
            })
            .catch(utils.failureHandler(self, event));
    };

    function loadVM(plan) {
        console.log(plan);
        self.plan = plan;
        self.labelObs(plan.label);
        self.schedulePlanTypeObs(plan.strategy.type);
        self.strategyObs(plan.strategy);
    }

    if (params.guid !== "new") {
        // TODO: Also want to direct this load to the parent screen, while maintaining the message...
        serverService.getSchedulePlan(params.guid).then(loadVM).catch(utils.failureHandler(self));
    } else {
        loadVM(newSchedulePlan());
    }
}