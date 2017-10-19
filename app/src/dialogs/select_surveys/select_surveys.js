import {serverService} from '../../services/server_service';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import tables from '../../tables';
import utils from '../../utils';

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
        if (params.allowMostRecent && selectedSurvey) {
            obj.createdOn = selectedSurvey.createdOn;
        } else if (!params.allowMostRecent) {
            obj.createdOn = survey.createdOn;
        }
        return obj;
    }

    function load() { 
        serverService.getSurveys()
            .then(fn.handleMap('items', surveyToView))
            .then(fn.handleSort('items', 'name'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());  
    }
    load();
};
