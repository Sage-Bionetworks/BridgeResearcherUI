import fn from "../../functions";
import ko from "knockout";
import root from "../../root";

export default class StudyTabset {
  constructor(params) {
    fn.copyProps(this, params, "identifierObs->studyIdObs", "isNewObs");
    this.computeds = [];
    this.linkMaker = function(tabName) {
      let c = ko.computed(() => `#/studies/${this.studyIdObs()}/${tabName}`);
      this.computeds.push(c);
      return c;
    };
  }
  canEditStudy() {
    return root.isDeveloper() || root.isStudyDesigner() || root.isAdmin();
  }
  canAdminParticipants() {
    return true;
    // return root.isResearcher() || root.isStudyCoordinator() || root.isAdmin();
  }
  dispose() {
    this.computeds.forEach(c => c.dispose());
  }
}
