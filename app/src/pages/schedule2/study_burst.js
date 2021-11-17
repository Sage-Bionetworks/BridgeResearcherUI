import { getEventIds } from "./schedule2utils";
import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import ko from "knockout";

const UPDATE_TYPES = [
  {label: "Immutable", value: "immutable"},
  {label: "Mutable", value: "mutable"},
  {label: "Future timestamps only", value: "future_only"}
];

export default function(params) {
  var self = this;
  var studyBurst = params.studyBurst;
  var studyBurstsObs = params.studyBurstsObs;
  self.prefix = 'studyBursts' + studyBurstsObs().indexOf(studyBurst);

  self.canEdit = ko.observable(true);

  studyBurst.binder = new Binder(self)
    .bind('identifier', studyBurst.identifier)
    .bind('originEventId', studyBurst.originEventId)
    .bind('delay', studyBurst.delay)
    .bind('interval', studyBurst.interval)
    .bind('occurrences', studyBurst.occurrences)
    .bind('updateType', studyBurst.updateType)
    .obs('allUpdateTypes[]', UPDATE_TYPES)
    .obs('allEventIds[]');

  self.generateId = function(fieldName) {
    if (fieldName.length) {
      fieldName = '_' + fieldName;
    }
    return self.prefix + fieldName;
  }
  self.removeStudyBurst = function(vm, event) {
    alerts.deleteConfirmation("Are you sure?", function() {
      let context = ko.contextFor(event.target);
      let obj = studyBurstsObs()[context.$index()];
      studyBurstsObs.remove(obj);
    }, "Remove");
  }
  self.firstOpacityObs = function(index) {
    return index === 0 ? .5 : 1;
  };
  self.lastOpacityObs = function(index) {
    return index === (studyBurstsObs().length-1) ? .5 : 1;
  };
  getEventIds(params.studyId).then(array => {
    self.allEventIdsObs(array);
    setTimeout(() => self.originEventIdObs(studyBurst.originEventId), 1);
  });  
}