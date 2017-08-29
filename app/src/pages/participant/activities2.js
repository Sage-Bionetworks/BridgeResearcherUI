import Binder from '../../binder';
import fn from '../../functions';
import root from '../../root';
import scheduleUtils from '../../pages/schedule/schedule_utils';
import optionsService from '../../services/options_service';
import serverService from '../../services/server_service';
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
    var self = this;

    new Binder(self)
        .obs('userId', params.userId)
        .obs('isNew', false)
        .obs('status')
        .obs('title', '&#160;');

    fn.copyProps(self, root, 'isPublicObs');

    tables.prepareTable(self, {
        name: "activitie",
        type: "Activity"
    });

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        self.statusObs(part.status);
    }).catch(FAILURE_HANDLER);

    self.linkMaker = function(ref) {
        var base = '#/participants/'+self.userIdObs()+'/newActivities/';
        return base + LINK_COMPONENTS[ref.type] + decodeURIComponent(ref.identifier);
    };

    function processPlans(response) {
        if (response.items.length) {
            response.items.forEach(processPlan);
        } else {
            self.itemsObs([]);
        }
    }
    function processPlan(plan) {
        optionsService.getActivities(plan).forEach(processActivity);
    }
    function processActivity(activity) {
        var item = {type: activity.activityType};
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
        self.itemsObs.push(item);
    }

    function load() {
        sharedModuleUtils.loadNameMaps()
            .then(serverService.getSchedulePlans)
            .then(processPlans);
    }
    load();
};