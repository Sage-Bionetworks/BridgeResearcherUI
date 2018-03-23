import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import optionsService from '../../services/options_service';
import root from '../../root';
import scheduleUtils from '../../pages/schedule/schedule_utils';
import sharedModuleUtils from '../../shared_module_utils';
import tables from '../../tables';
import utils from '../../utils';

const FAILURE_HANDLER = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});
const LINK_COMPONENTS = {
    'task': 'tasks/',
    'survey': 'surveys/',
    'compound': 'compoundActivities/'
};

module.exports = function(params) {
    let self = this;

    self.tempDedupMap = {};

    new Binder(self)
        .obs('userId', params.userId)
        .obs('isNew', false)
        .obs('status')
        .obs('title', '&#160;');

    tables.prepareTable(self, {
        name: "activitie",
        type: "Activity"
    });

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(part.name);
        self.statusObs(part.status);
    }).catch(FAILURE_HANDLER);

    self.linkMaker = function(ref) {
        let base = '#/participants/'+self.userIdObs()+'/newActivities/';
        return base + LINK_COMPONENTS[ref.type] + decodeURIComponent(ref.identifier);
    };

    function processPlans(response) {
        if (response.items.length) {
            response.items.forEach(processPlan);
        } else {
            self.itemsObs([]);
        }
        return response;
    }
    function processPlan(plan) {
        optionsService.getActivities(plan).forEach(processActivity);
    }
    function processActivity(activity) {
        let item = {type: activity.activityType};
        if (activity.task) {
            item.label = activity.task.identifier;
            item.identifier = activity.task.identifier;
        } else if (activity.survey) {
            item.label = sharedModuleUtils.getSurveyName(activity.survey.guid);
            item.identifier = activity.survey.guid;
        } else if (activity.compoundActivity) {
            item.label = activity.compoundActivity.taskIdentifier;
            item.identifier = activity.compoundActivity.taskIdentifier;
        }
        self.tempDedupMap[item.identifier] = item;
    }
    function sortPlans(response) {
        let array = Object.values(self.tempDedupMap);
        array.sort(function(a,b) {
            return a.label.localeCompare(b.label);
        });
        self.itemsObs(array);
    }

    sharedModuleUtils.loadNameMaps()
        .then(serverService.getSchedulePlans.bind(serverService))
        .then(processPlans)
        .then(sortPlans);
};