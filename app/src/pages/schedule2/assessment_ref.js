import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";

export default function(params) {
  var self = this;
  var assessmentsObs = params.assessmentsObs;
  var assessment = params.assessment;
  var index = assessmentsObs().indexOf(assessment);
  self.prefix = params.prefix + '_assessments' + index;

  assessment.binder = new Binder(self)
    .bind('guid', assessment.guid)
    .bind('appId', assessment.appId)
    .bind('title', assessment.title)
    .bind('identifier', assessment.identifier)
    .bind('minutesToComplete', assessment.minutesToComplete)
    .bind('labels[]', assessment.labels, null, Binder.persistArrayWithBinder);

  self.generateId = function(fieldName) {
    return `${self.prefix}_${fieldName}`;
  }
  self.addLabel = function() {
    self.labelsObs.push({});
  }
  self.remove = function(vm, event) {
    let $context = ko.contextFor(event.target);
    assessmentsObs.remove(assessmentsObs()[$context.$index()]);
  }
  self.moveAssessmentUp = function(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index > 0) {
      let array = fn.moveArrayItem(assessmentsObs(), index, index-1);
      assessmentsObs(array);
    }
  }
  self.moveAssessmentDown = function(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index < assessmentsObs().length) {
      let array = fn.moveArrayItem(assessmentsObs(), index, index+1);
      assessmentsObs(array);
    }
  }
  self.firstOpacityObs = function(index) {
    return index === 0 ? .5 : 1;
  };
  self.lastOpacityObs = function(index) {
    return index === (assessmentsObs().length-1) ? .5 : 1;
  };
}