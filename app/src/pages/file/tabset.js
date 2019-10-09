import fn from "../../functions";
import ko from "knockout";

export default function fileTabset(params) {
  let self = this;
  fn.copyProps(self, params, "isNewObs", "guidObs");

  self.computeds = [];
  self.linkMaker = function(postfix) {
    let c = ko.computed(function() {
      return "#/files/" + self.guidObs() + "/" + postfix;
    });
    self.computeds.push(c);
    return c;
  };
  self.computeds.push(self.revisionLabel);
};
fileTabset.prototype.dispose = function() {
  this.computeds.forEach(function(c) {
    if (c) { c.dispose() };
  });
};
