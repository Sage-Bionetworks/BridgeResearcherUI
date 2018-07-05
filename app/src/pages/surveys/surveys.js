import {serverService} from '../../services/server_service';
import fn from '../../functions';
import ko from 'knockout';
import Promise from 'bluebird';
import root from '../../root';
import sharedModuleUtils from '../../shared_module_utils';
import tables from '../../tables';
import utils from '../../utils';

const SURVEY_FIELDS_TO_DELETE = ['guid','version','createdOn','modifiedOn','published','deleted'];

function addScheduleField(survey) {
    survey.schedulePlanObs = ko.observableArray([]);
}
function collectGuids(object, array) {
    Object.keys(object).forEach(function(prop) {
        if (prop === "survey") {
            array.push(object[prop].guid);
        } else if (typeof object[prop] === "object") {
            collectGuids(object[prop], array);
        }
    });
    return array;
}
function annotateSurveys(surveys, plans) {
    plans.forEach(function(plan) {
        let allPlanGuids = collectGuids(plan, []);    
        surveys.forEach(function(survey) {
            if (allPlanGuids.indexOf(survey.guid) > -1) {
                survey.schedulePlanObs.push({label: plan.label, guid: plan.guid});
            } 
        });
    });
}

module.exports = function() {
    let self = this;

    fn.copyProps(self, fn, 'formatDateTime');
    fn.copyProps(self, root, 'isDeveloper', 'isAdmin');
    fn.copyProps(self, sharedModuleUtils, 'formatModuleLink', 'moduleHTML');
    
    tables.prepareTable(self, {
        name: 'survey',
        type: 'Survey',
        delete: function(item) {
            return serverService.getSurveyAllRevisions(item.guid).then(response => {
                return Promise.map(response.items, item => {
                    return serverService.deleteSurvey(item, false);
                });
            });
        },
        deletePermanently: function(item) {
            return serverService.getSurveyAllRevisions(item.guid, true).then(response => {
                return Promise.map(response.items, item => {
                    return serverService.deleteSurvey(item, true);
                });
            });
        },
        refresh: load
    });
    self.formatSchedules = function(survey) {
        return survey.schedulePlanObs().map(function(obj) {
            return obj.label;
        }).join(', ');
    };
    self.copySurveys = function(vm, event) {
        let copyables = self.itemsObs().filter(tables.hasBeenChecked);
        let confirmMsg = (copyables.length > 1) ?
            "Surveys have been copied." : "Survey has been copied.";

        utils.startHandler(vm, event);
        Promise.mapSeries(copyables, function(survey) {
            return serverService.getSurvey(survey.guid, survey.createdOn).then(function(fullSurvey) {
                fullSurvey.name += " (Copy)";
                SURVEY_FIELDS_TO_DELETE.forEach(function(field) {
                    delete fullSurvey[field]; 
                });
                fullSurvey.elements.forEach(function(element) {
                    delete element.guid;
                });
                return serverService.createSurvey(fullSurvey);
            });
        }).then(load)
            .then(utils.successHandler(vm, event, confirmMsg))
            .catch(utils.failureHandler());
    };
    self.openModuleBrowser = function() {
        root.openDialog('module_browser', {
            type: 'survey', 
            closeModuleBrowser: self.closeModuleBrowser
        });
    };
    self.closeModuleBrowser = function() {
        root.closeDialog();
        load();
    };
    function getSchedulePlans(response) {
        if (response.items.length) {
            var surveys = response.items;
            return serverService.getSchedulePlans().then(function(res) {
                annotateSurveys(surveys, res.items);
            });
        }
    }
    function load() {
        return sharedModuleUtils.loadNameMaps()
            .then(serverService.getSurveys.bind(serverService))
            .then(fn.handleSort('items','name'))
            .then(fn.handleForEach('items', addScheduleField))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .then(getSchedulePlans)
            .catch(utils.failureHandler());
    }
    load();
};