import fn from "../../functions";
import ko from "knockout";

export default function tabset(params) {
  let self = this;
  fn.copyProps(self, params, "isNewObs", "idObs", "revisionObs");

  self.computeds = [];
  self.linkMaker = function(postfix) {
    let c = ko.computed(function() {
      return "#/configs/" + self.idObs() + "/revisions/" + self.revisionObs() + "/" + postfix;
    });
    self.computeds.push(c);
    return c;
  };
  self.revisionLabel = ko.computed(function() {
    if (self.revisionObs()) {
      return "v" + self.revisionObs();
    }
    return "";
  });
  self.computeds.push(self.revisionLabel);
};
tabset.prototype.dispose = function() {
  this.computeds.forEach(function(c) {
    c.dispose();
  });
};
