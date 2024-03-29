import fn from "../../functions";
import ko from "knockout";
import root from "../../root";

export default function tabset(params) {
  let self = this;

  fn.copyProps(self, params, "identifierObs", "isNewObs");
  fn.copyProps(self, root, "isOrgAdmin");

  self.computeds = [];
  self.linkMaker = function(tabName) {
    let c = ko.computed(function() {
      return "/organizations/" + self.identifierObs() + '/' + tabName;
    });
    self.computeds.push(c);
    return c;
  };
};
tabset.prototype.dispose = function() {
  this.computeds.forEach(function(c) {
    c.dispose();
  });
};
