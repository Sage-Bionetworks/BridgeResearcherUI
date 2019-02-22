import fn from "../../functions";
import ko from "knockout";

module.exports = function(params) {
  let self = this;

  fn.copyProps(self, params, "guidObs", "isNewObs");
  fn.copyProps(self, fn, "formatDateTime");

  // Only passed in on the on the general tab
  if (!self.isNewObs) {
    self.isNewObs = ko.observable(false);
  }

  self.computeds = [];
  self.linkMaker = function(tabName) {
    let c = ko.computed(function() {
      return "#/subpopulations/" + self.guidObs() + "/" + tabName;
    });
    self.computeds.push(c);
    return c;
  };
};
module.exports.prototype.dispose = function() {
  this.computeds.forEach(function(c) {
    c.dispose();
  });
};
