import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

/**
 * params:
 *  selectOne: allow selection of only one element
 *  addSelectedRefs: function to receive selected assessment refs
 *  selected: list of selected refs
 */
export default function(params) {
  let self = this;
  params.selected = params.selected || [];

  let selectedGuids = params.selected.map(ref => ref.guid);
  
  self.tabObs = ko.observable('local');
  self.localsObs = ko.observableArray([]);
  self.sharedObs = ko.observableArray([]);

  self.cancel = root.closeDialog;

  function selectByChecked(item) {
    return item.checkedObs();
  }

  self.select = function() {
    let selectedLocals = self.localsObs().filter(selectByChecked);
    let selectedShared = self.sharedObs().filter(selectByChecked);
    params.addAssessmentRefs(selectedLocals.concat(selectedShared));
  };

  function configToView(assessment) {
    assessment.checkedObs = ko.observable( selectedGuids.indexOf(assessment.guid) > -1 );
    return assessment;
  }

  function load() {
    serverService.getAssessments('', null, 100, false)
      .then(fn.handleMap("items", configToView))
      .then(fn.handleSort("items", "identifier"))
      .then(fn.handleObsUpdate(self.localsObs, "items"))
      .catch(utils.failureHandler({}));
    serverService.getSharedAssessments({pageSize: 100}, false)
      .then(fn.handleMap("items", configToView))
      .then(fn.handleSort("items", "identifier"))
      .then(fn.handleObsUpdate(self.sharedObs, "items"))
      .catch(utils.failureHandler({}));
  }
  load();
};
