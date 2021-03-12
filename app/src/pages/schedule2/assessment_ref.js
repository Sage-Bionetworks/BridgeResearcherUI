import Binder from "../../binder";
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
}