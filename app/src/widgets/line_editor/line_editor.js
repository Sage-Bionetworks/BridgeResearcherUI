import Binder from "../../binder";
import utils from "../../utils";
import ko from "knockout";

export default function(params) {
  let self = this;

  self.arrayObs = params.arrayObs;
  self.canEdit = params.canEdit || (() => true);
  self.indexObs = ko.observable();
  self.addObs = ko.observable();

  self.label = 'New ' + params.label + '...';

  self.remove = function(item) {
    self.arrayObs.remove(item);
  }
  self.add = function() {
    let value = self.addObs();
    if (value && value.trim() && !self.arrayObs().includes(value)) {
      self.arrayObs.push(value.trim());
      self.addObs('');
    }
  }
  self.keyHandler = function(view, e) {
    if (e.keyCode === 13) {
      self.add();
      return false;
    }
    return true;
  };

};
