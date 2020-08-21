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
    return params.selected.filter((selAssessment) => {
      console.log("assessment", assessment, "selAssessment", selAssessment);
      return selAssessment.id === assessment.identifier
    })[0];
  }
  function configToView(assessment) {
    let selectedAssessment = match(assessment);
    let checked = !!selectedAssessment;
    selectedAssessment = selectedAssessment || {};
    return {
      title: selectedAssessment.title || assessment.title,
      guid: selectedAssessment.guid || assessment.guid,
      id: selectedAssessment.id || assessment.id,
      checkedObs: ko.observable(checked)
    };
  }

  function load() {
    serverService.getAssessments('', null, null, false)
      .then(fn.handleMap("items", configToView))
      .then(fn.handleSort("items", "id"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({}));
  }
  load();
};
