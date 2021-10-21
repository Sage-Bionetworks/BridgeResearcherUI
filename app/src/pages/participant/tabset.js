import fn from "../../functions";
import ko from "knockout";
import root from "../../root";

export default function tabset(params) {
  let self = this;

  if (!params.isNewObs) {
    params.isNewObs = ko.observable(false);
  }
  fn.copyProps(self, params, "isNewObs", "userIdObs", "statusObs", "dataGroupsObs");
  fn.copyProps(self, root, "isDeveloper", "isResearcher");

  self.computeds = [];
  self.linkMaker = function(postfix) {
    let c = ko.computed(function() {
      return `/participants/${self.userIdObs()}/${postfix}`;
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
