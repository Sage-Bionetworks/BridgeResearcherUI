import ko from "knockout";

export default function(params) {
  let self = this;

  self.selectedObs = params.selectedObs;
  self.allObs = ko.observableArray(params.allObs().slice());
  self.noneSelected = "No " + params.type + " selected";
  self.dropdown = null;

  params.allObs.subscribe(function(array) {
    let copy = array.slice();
    copy.sort();
    self.allObs(copy);
  });
  self.selectedObs.subscribe(function(array) {
    for (let i = 0; i < array.length; i++) {
      self.allObs.remove(array[i]);
    }
  });

  function transfer(srcObs, destObs, item) {
    srcObs.remove(item);
    let array = destObs();
    array.push(item);
    array.sort();
    destObs(array);
  }

  self.addTag = function(item, event) {
    if (self.dropdown === null) {
      self.dropdown = $(event.target.parentNode.parentNode);
    }
    if (self.allObs().length === 1) {
      self.dropdown.dropdown("hide");
    }
    transfer(self.allObs, self.selectedObs, item);
  };
  self.removeTag = function(item, event) {
    transfer(self.selectedObs, self.allObs, item);
  };
};
