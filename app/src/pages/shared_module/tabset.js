import ko from "knockout";

export default function tabset(params) {
  let self = this;

  self.versionObs = params.viewModel.versionObs;
  self.idObs = params.viewModel.idObs;
  self.isNewObs = params.viewModel.isNewObs;
  self.publishedObs = params.viewModel.publishedObs;
  self.selected = params.selected;

  self.computeds = [];
  self.linkMaker = function(tabName) {
    let c = ko.computed(function() {
      let url = "#/shared_modules/" + encodeURIComponent(self.idObs()) + "/versions/" + self.versionObs();
      url += tabName == "editor" ? "/editor" : "/history";
      return url;
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
