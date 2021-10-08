import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

function selectByChecked(item) {
  return item.checkedObs();
}

/**
 * params:
 *  selected: list of currently selected refs. They need to have the assessment GUID, nothing
 *    else is required.
 *  addAssessmentRefs: the function to receive back the list of selected assessments.
 */
export default class SelectAssessmentRefs {
  constructor(params) {
    this.selected = params.selected || [];
    this.selectedGuids = this.selected.map(ref => ref.guid);
    this.addAssessmentRefs = params.addAssessmentRefs;
    this.cancel = root.closeDialog;
    this.tabObs = ko.observable('local');
    this.localsObs = ko.observableArray([]);
    this.sharedObs = ko.observableArray([]);
    this.load();
  }
  load() {
    // Only gets the first 100 assessments...we may eventually want to add filtering
    // by tags or something.
    serverService.getAssessments('', null, 100, false)
      .then(fn.handleMap("items", this.configToView.bind(this)))
      .then(fn.handleSort("items", "title"))
      .then(fn.handleObsUpdate(this.localsObs, "items"))
      .catch(utils.failureHandler({}));
    serverService.getSharedAssessments({pageSize: 100}, false)
      .then(fn.handleMap("items", this.configToView.bind(this)))
      .then(fn.handleSort("items", "title"))
      .then(fn.handleObsUpdate(this.sharedObs, "items"))
      .catch(utils.failureHandler({}));
  }
  select() {
    let selectedLocals = this.localsObs().filter(selectByChecked);
    let selectedShared = this.sharedObs().filter(selectByChecked);
    this.addAssessmentRefs(selectedLocals.concat(selectedShared));
  }
  configToView(assessment) {
    assessment.checkedObs = ko.observable( this.selectedGuids.indexOf(assessment.guid) > -1 );
    return assessment;
  }
}
