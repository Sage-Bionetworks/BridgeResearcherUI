import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

/**
 * params:
 *  selectOne: allow selection of only one element
 *  allowMostRecent: boolean to clear most createdOn
 *  addSurveys: function to receive selected survey(s)
 *  selected: survey list
 */
export default function(params) {
  let self = this;

  self.title = params.selectOne ? "Select Survey" : "Select Surveys";
  self.controlName = params.selectOne ? "ui-radio" : "ui-checkbox";
  self.cancel = root.closeDialog;

  function selectByGuid(selGuid) {
    return function(item) {
      return item.guid === selGuid;
    };
  }
  function selectByChecked(item) {
    return item.checkedObs();
  }

  self.select = function() {
    let filterFunc = params.selectOne ? 
      selectByGuid($("input[type=radio]:checked").toArray()[0].id.substring(1)) : 
      selectByChecked;
    let surveys = self.itemsObs().filter(filterFunc);
    params.addSurveys(surveys);
  };

  tables.prepareTable(self, {
    name: "survey",
    type: "Survey",
    refresh: load
  });

  function match(survey) {
    return params.selected.filter(function(selectedSurvey) {
      return selectedSurvey.guid === survey.guid;
    })[0];
  }
  function surveyToView(survey) {
    let selectedSurvey = match(survey);
    let checked = !!selectedSurvey;
    selectedSurvey = selectedSurvey || {};
    return {
      guid: selectedSurvey.guid || survey.guid,
      name: selectedSurvey.name || survey.name,
      createdOn: selectedSurvey.createdOn || survey.createdOn,
      checkedObs: ko.observable(checked)
    };
  }

  function load() {
    serverService
      .getSurveys()
      .then(fn.handleMap("items", surveyToView))
      .then(fn.handleSort("items", "name"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler());
  }
  load();
};
