var serverService = require('../../services/server_service');
var root = require('../../root');
var utils = require('../../utils');
var tables = require('../../tables');
var ko = require('knockout');

/**
 * params:
 *  selectOne: allow selection of only one element
 *  allowMostRecent: boolean to clear most createdOn 
 *  addSurveys: function to receive selected survey(s)
 *  selected: survey list
 */
module.exports = function(params) {
    var self = this;
    
    self.title = params.selectOne ? 'Select Survey' : 'Select Surveys';
    self.controlName = params.selectOne ? 'ui-radio' : 'ui-checkbox';
    self.cancel = root.closeDialog;

    function selectByGuid(selGuid)  {
        return function(item) {
            return item.guid === selGuid;
        };
    }
    function selectByChecked(item) {
        return item.checkedObs();
    }

    self.select = function() {
        var filterFunc = (params.selectOne) ?
            selectByGuid($("input[type=radio]:checked").toArray()[0].id.substring(1)) :
            selectByChecked;
        var surveys = self.itemsObs().filter(filterFunc);
        params.addSurveys(surveys);
    };

    tables.prepareTable(self, {
        name: "survey",
        type: "Survey",
        refresh: load
    });

    function isSelected(survey) {
        return !!match(survey);
    }
    function notSelected(survey) {
        return !isSelected(survey);
    }
    function match(survey) {
        return params.selected.filter(function(selectedSurvey) {
            return (selectedSurvey.guid === survey.guid);
        })[0];
    }
    function surveyToView(survey) {
        var selectedSurvey = match(survey);
        var obj = {
            guid: survey.guid, 
            name: survey.name, 
            checkedObs: ko.observable(!!selectedSurvey)
        };
        if (params.allowMostRecent || selectedSurvey) {
            obj.createdOn = selectedSurvey.createdOn;
        } else if (!params.allowMostRecent) {
            obj.createdOn = survey.createdOn;
        }
        return obj;
    }

    function load() { 
        serverService.getPublishedSurveys().then(function(response) {
            var items = response.items.sort(utils.makeFieldSorter("name")).map(surveyToView);
            self.itemsObs.pushAll(items);
        }).catch(utils.failureHandler());
    }
    load();
};
