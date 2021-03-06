import ko from "knockout";
import Binder from "../../binder";

export default function(params) {
  var self = this;
  var labelsObs = params.labelsObs;
  var label = params.label;
  var index = labelsObs().indexOf(label);
  self.prefix = params.prefix + 'labels' + index;

  self.canEditObs = params.canEditObs || ko.observable(true);

  label.binder = new Binder(self)
    .bind('lang', label.lang)
    .bind('value', label.value);

  self.generateId = function(fieldName) {
    return `${self.prefix}_${fieldName}`;
  }
  self.addBelow = function() {
    labelsObs.push({ 'lang': null });
  }
  self.removeLabel = function(vm, event) {
    let $context = ko.contextFor(event.target);
    labelsObs.remove(labelsObs()[$context.$index()]);
  }

}