import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import optionsService from '../../services/options_service';
import Promise from 'bluebird';
import scheduleUtils from '../schedule/schedule_utils';
import utils from '../../utils';

const failureHandler = utils.failureHandler({
    redirectTo: "scheduleplans",
    redirectMsg: "Schedule plan not found."
});

/**
 * The complexity of this view comes from the fact that the entire data model is in the strategy,
 * and the strategy can entirely change the data model.
 * @param params
 */
module.exports = function(params) {
    let self = this;
    
    // The callback function will be called when saving the schedule plan; the strategy 
    // implementation must implement this callback to return a strategy object.
    let binder = new Binder(self)
        .bind('strategy', null, null, Binder.callObsCallback)
        .bind('label', '')
        .obs('schedulePlanType', (params.guid==="new") ? 'SimpleScheduleStrategy' : 'empty');
        
    fn.copyProps(self.strategyObs, fn, 'identity->callback');
    fn.copyProps(self, scheduleUtils, 'schedulePlanTypeOptions', 'schedulePlanTypeLabel');

    self.schedulePlanTypeObs.subscribe(function(newType) {
        if (self.strategyObs.callback()) {
            let newStrategy = scheduleUtils.newStrategy(newType, self.strategyObs.callback());
            // In theory this should be happening after the page has re-rendered, but this is
            // not true. Without this timeout, the criteria or group arrays won't be rendered.
            setTimeout(function() {
                self.strategyObs(newStrategy);
            }, 1);
        }
    });

    self.save = function(vm, event) {
        self.plan = binder.persist(self.plan);
        fn.deleteUnusedProperties(self.plan);

        utils.startHandler(self, event);
        serverService.saveSchedulePlan(self.plan)
            .then(getFullSchedulePlan)
            .then(fn.handleObsUpdate(self.strategyObs, 'strategy'))
            .then(utils.successHandler(self, event, "The schedule plan has been saved."))
            .catch(failureHandler);
    };
    self.updateType = function(vm, event) {
        let spType = event.target.getAttribute('data-type');
        if (spType) {
            self.schedulePlanTypeObs(event.target.getAttribute('data-type'));
        }
    };

    // TODO: binder doesn't know how to update an observable from a completely different, nested property...
    function updateScheduleTypeObs(plan) {
        self.schedulePlanTypeObs(plan.strategy.type);
        return plan;
    }
    function getFullSchedulePlan(response) {
        return serverService.getSchedulePlan(response.guid);
    }
    function resolveActivity(activity) {
        return serverService.getTaskDefinition(activity.compoundActivity.taskIdentifier)
            .then(function(task) {
                activity.compoundActivity = task;
                activity.compoundActivity.taskIdentifier = task.taskId;
                return activity;
            })
            .catch(failureHandler);
    }
    function isCompoundActivity(activity) {
        return activity.activityType === "compound";
    }
    // These are not actually filled out on the server.
    function addCompoundActivitiesToPlan(plan) {
        let activities = optionsService.getActivities(plan).filter(isCompoundActivity);
        return Promise.map(activities, resolveActivity).then(function() {
            return plan;
        });
    }
    function schedulePlan() {
        return (params.guid !== "new") ?
            serverService.getSchedulePlan(params.guid) :
            Promise.resolve(scheduleUtils.newSchedulePlan());
    }

    scheduleUtils.loadOptions().then(function() {
        schedulePlan().then(addCompoundActivitiesToPlan)
            .then(binder.assign('plan'))
            .then(updateScheduleTypeObs)
            .then(binder.update())
            .catch(failureHandler);
    });
};