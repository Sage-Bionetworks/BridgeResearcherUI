import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";

function bindColor(assessment, field) {
  assessment.binder.bind(field, (assessment.colorScheme) ? assessment.colorScheme[field] : null, 
    Binder.fromObjectField("colorScheme", field),
    Binder.toObjectField("colorScheme", field))
}

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
    .bind('revision', assessment.revision)
    .bind('minutesToComplete', assessment.minutesToComplete || 0)
    .bind('labels[]', assessment.labels, null, Binder.persistArrayWithBinder);
  bindColor(assessment, "background");
  bindColor(assessment, "foreground");
  bindColor(assessment, "activated");
  bindColor(assessment, "inactivated");

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
  self.minutesFormatted = function(min) {
    return (min === 0) ? '' : `${min}min`;
  }
}