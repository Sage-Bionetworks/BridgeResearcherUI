import { getEventIds } from "./schedule2utils";
import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";

const PERFORMANCE_ORDER_OPTIONS = [
  {text: 'Sequential', value: 'sequential'},
  {text: 'Randomized', value: 'randomized'},
  {text: 'In order participant chooses', value: 'participant_choice'}
];

export default function(params) {
  var self = this;
  var session = params.session;
  var sessionsObs = params.sessionsObs;
  var studyBurstsObs = params.studyBurstsObs;
  self.prefix = 'sessions' + sessionsObs().indexOf(session);

  session.binder = new Binder(self)
    .bind('guid', session.guid)
    .bind('name', session.name)
    .bind('startEventIds[]', session.startEventIds || [])
    .bind('delay', session.delay)
    .bind('occurrences', session.occurrences)
    .bind('interval', session.interval)
    .bind('performanceOrder', session.performanceOrder)
    .bind('studyBurstIds[]', session.studyBurstIds || [])
    .bind('labels[]', session.labels, null, Binder.persistArrayWithBinder)
    .bind('assessments[]', session.assessments, null, Binder.persistArrayWithBinder)
    .bind('timeWindows[]', session.timeWindows, null, Binder.persistArrayWithBinder)
    .bind('notifications[]', session.notifications, null, Binder.persistArrayWithBinder)
    .obs('performanceOrderTypes', PERFORMANCE_ORDER_OPTIONS)
    .obs('allEventIds[]', []);

  self.formatStudyBurstIds = ko.computed(function() {
    return (self.studyBurstIdsObs().length > 0) ? self.studyBurstIdsObs().join('<br>') : '&lt;None&gt;';
  });
  self.editStudyBurstIds = function(vm, event) {
    let ids = studyBurstsObs().map(burst => burst.identifier);
    root.openDialog('select_study_bursts', {
      allStudyBurstIds: ids,
      studyBurstIdsObs: self.studyBurstIdsObs
    });
  }
  self.clearStudyBurstIds = function(vm, event) {
    self.studyBurstIdsObs([]);
  }
  self.totalMinutesObs = ko.computed(function() {
    var sum = self.assessmentsObs()
      .map(asmt => asmt.minutesToComplete).reduce((a,  b) => a + b, 0);
    if (isNaN(sum) || sum < 1) {
      return '';
    } else if (sum === 1) {
      return '1 minute';
    } else {
      return sum + ' minutes';
    }
  });

  self.generateId = function(fieldName) {
    if (fieldName.length) {
      fieldName = '_' + fieldName;
    }
    return self.prefix + fieldName;
  }
  self.moveSessionUp = function(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index > 0) {
      let array = fn.moveArrayItem(sessionsObs(), index, index-1);
      sessionsObs(array);
    }
  }
  self.moveSessionDown = function(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index < sessionsObs().length) {
      let array = fn.moveArrayItem(sessionsObs(), index, index+1);
      sessionsObs(array);
    }
  }
  self.removeSession = function(vm, event) {
    alerts.deleteConfirmation("If you remove this session and then save the schedule, "+
      "the session cannot be restored. Continue to remove it?", function() {
      let context = ko.contextFor(event.target);
      let obj = sessionsObs()[context.$index()];
      sessionsObs.remove(obj);
    }, "Remove");
  }
  self.firstOpacityObs = function(index) {
    return index === 0 ? .5 : 1;
  };
  self.lastOpacityObs = function(index) {
    return index === (sessionsObs().length-1) ? .5 : 1;
  };
  self.addAssessments = function(assessments) {
    // We don't want to overwrite the assessments that are already in
    // the session, because they might have been modified (in particular,
    // there might be labels). Once added you should be able to edit the 
    // reference without wiping it out.
    var selected = assessments.reduce(function(obj, val) {
      obj[val.guid] = val;
      return obj;
    }, {});
    var current = self.assessmentsObs().reduce(function(obj, val) {
      obj[val.guid] = val;
      return obj;
    }, {});
    var selectedKeys = new Set(Object.keys(selected));
    var currentKeys = new Set(Object.keys(current));
    currentKeys.forEach(guid => {
      if (!selectedKeys.has(guid)) {
        self.assessmentsObs.remove(current[guid]);
      }
    });
    selectedKeys.forEach(guid => {
      if (!currentKeys.has(guid)) {
        self.assessmentsObs.push(selected[guid]);
      }
    });
    root.closeDialog();
  };
  self.openAssessmentDialog = function() {
    root.openDialog("select_assessment_refs", {
      selected: self.assessmentsObs(),
      addAssessmentRefs: self.addAssessments.bind(self)
    });
  }
  self.addWindow = function() {
    self.timeWindowsObs.push({
      'startTime': '08:00'
    });
  }
  self.addLabel = function() {
    self.labelsObs.push({});
  }
  self.addNotification = function() { 
    self.notificationsObs.push({messages: [{}]});
  }

  getEventIds(params.studyId).then(array => {
    self.allEventIdsObs(array.map(o => o.value));
  });
}