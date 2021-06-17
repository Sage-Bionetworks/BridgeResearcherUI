import fn from "../../functions";
import ko from "knockout";

export default class AssessmentTabset {
  constructor(params) {
    fn.copyProps(this, params, "guidObs", "isNewObs", "revisionObs", 
      "originGuidObs", "canEditObs");
    this.computeds = [];
    this.linkMaker = (tabName) => {
      let c = ko.computed(() => `#/assessments/${this.guidObs()}/${tabName}`);
      this.computeds.push(c);
      return c;
    };
  }
}
AssessmentTabset.prototype.dispose = function() {
  this.computeds.forEach(function(c) {
    c.dispose();
  });
};
