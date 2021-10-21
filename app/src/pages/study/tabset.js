import config from "../../config";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";

export default class StudyTabset {
  constructor(params) {
    fn.copyProps(this, params, "identifierObs->studyIdObs", "isNewObs");
    this.computeds = [];
    this.linkMaker = function(tabName) {
      let c = ko.computed(() => `/studies/${this.studyIdObs()}/${tabName}`);
      this.computeds.push(c);
      return c;
    };
    this.phaseObs = params.phaseObs;
  }
  formatPhase() {
    if (this.phaseObs()) {
      let phase = this.phaseObs();
      return config.phasesOpts.filter(opt => opt.value === phase)[0].label;
    }
    return '';
  }
  canEditStudy() {
    return root.isDeveloper() || root.isStudyDesigner() || root.isAdmin();
  }
  canAdminParticipants() {
    return root.isResearcher() || root.isStudyCoordinator() || root.isStudyDesigner() || root.isAdmin();
  }
  dispose() {
    this.computeds.forEach(c => c.dispose());
  }
}
