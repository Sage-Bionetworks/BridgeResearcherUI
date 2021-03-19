import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

/**
 * params:
 *  selectOne: allow selection of only one element
 *  addConfigs: function to receive selected schemas(s)
 *  selected: config list
 */
export default function(params) {
  let self = this;
  params.selected = params.selected || [];
  
  self.cancel = root.closeDialog;

  function selectByChecked(item) {
    return item.checkedObs();
  }

  const selectedGuids = new Set(params.selected.map(item => item.identifier));

  self.select = function() {
    let assessments = self.itemsObs().filter(selectByChecked);
    params.addAssessments(assessments);
  };

  tables.prepareTable(self, {
    name: "assessment",
    type: "Assessment",
    id: "select-assessments",
    refresh: load
  });

  function match(assessment) {
    return selectedGuids.has(assessment.identifier);
  }
  function configToView(assessment) {
    assessment.checkedObs = ko.observable(match(assessment));
    return assessment;
  }

  function load() {
    serverService.getAssessments('', null, 100, false)
      .then(fn.handleMap("items", configToView))
      .then(fn.handleSort("items", "title"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({}));
  }
  load();
};
