import fn from "../../functions";
import ko from "knockout";

const POSTFIXES = {
  schema: "/schema",
  history: "/versions",
  editor: "/editor"
};

module.exports = function(params) {
  let self = this;

  fn.copyProps(self, fn, "formatDateTime");
  fn.copyProps(self, params.viewModel, "guidObs", "createdOnObs", "publishedObs");

  self.computeds = [];
  self.linkMaker = function(tabName) {
    let c = ko.computed(function() {
      let url = "#/surveys/" + self.guidObs();
      if (self.createdOnObs()) {
        let createdOn = self.createdOnObs();
        if (typeof createdOn === "string") {
          createdOn = new Date(createdOn);
        }
        url += "/" + createdOn.toISOString();
      }
      url += POSTFIXES[tabName];
      return url;
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
