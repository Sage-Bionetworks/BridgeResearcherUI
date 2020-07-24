import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";

export default function asmTabset(params) {
  let self = this;

  fn.copyProps(self, params, "guidObs", "isNewObs", "revisionObs", "originGuidObs");

  // Only passed in on the on the general tab
  if (!self.isNewObs) {
    self.isNewObs = ko.observable(false);
  }

  self.computeds = [];
  self.linkMaker = function(tabName) {
    let c = ko.computed(function() {
      return "#/sharedassessments/" + self.guidObs() + "/" + tabName;
    });
    self.computeds.push(c);
    return c;
  };
};
asmTabset.prototype.dispose = function() {
  this.computeds.forEach(function(c) {
    c.dispose();
  });
};
