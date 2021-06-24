import fn from "../../functions";
import ko from "knockout";

export default class AsmtTabset {
  constructor(params) {
    fn.copyProps(this, params, "guidObs", "isNewObs", "revisionObs", "originGuidObs");
    if (!this.isNewObs) {
      this.isNewObs = ko.observable(false);
    }
    this.computeds = [];
  }
  linkMaker(tabName) {
    let c = ko.computed(() => `#/sharedassessments/${this.guidObs()}/${tabName}`);
    this.computeds.push(c);
    return c;
  }
  dispose() {
    this.computeds.forEach(function(c) {
      c.dispose();
    });
  }
}
