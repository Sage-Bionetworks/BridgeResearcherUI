import { getEventIds } from "./schedule2utils";
import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import ko from "knockout";
import root from "../../root";

const NOTIFY_AT_OPTIONS = [
  {text: 'At start of window', value: 'start_of_window'},
  {text: 'At random', value: 'random'},
  {text: 'At time participant chooses', value: 'participant_choice'}
];

const REMIND_AT_OPTIONS = [
  {text: 'After window starts', value: 'after_window_start'},
  {text: 'Before window ends', value: 'before_window_end'}
];

const PERFORMANCE_ORDER_OPTIONS = [
  {text: 'Sequential', value: 'sequential'},
  {text: 'Randomized', value: 'randomized'},
  {text: 'In order participant chooses', value: 'participant_choice'}
];

function moveArrayItem(array, from, to) {
  array.splice(to, 0, array.splice(from, 1)[0]);
  return array;
};

export default function(params) {
  var self = this;
  var session = params.session;
  var sessionsObs = params.sessionsObs;
  self.prefix = 'sessions' + sessionsObs().indexOf(session);

  session.binder = new Binder(self)
    .bind('guid', session.guid)
    .bind('name', session.name)
    .bind('startEventId', session.startEventId)
    .bind('delay', session.delay)
    .bind('occurrences', session.occurrences)
    .bind('interval', session.interval)
    .bind('notifyAt', session.notifyAt)
    .bind('remindAt', session.remindAt)
    .bind('performanceOrder', session.performanceOrder)
    .bind('reminderPeriod', session.reminderPeriod)
    .bind('allowSnooze', session.allowSnooze)
    .bind('assessments[]', session.assessments, null, Binder.persistArrayWithBinder)
    .bind('timeWindows[]', session.timeWindows, null, Binder.persistArrayWithBinder)
    .bind('labels[]', session.labels, null, Binder.persistArrayWithBinder)
    .bind('messages[]', session.messages, null, Binder.persistArrayWithBinder)
    .obs('enableReminder')
    .obs('index')
    .obs('aIndex')
    .obs('notifyAtTypes', NOTIFY_AT_OPTIONS)
    .obs('remindAtTypes', REMIND_AT_OPTIONS)
    .obs('performanceOrderTypes', PERFORMANCE_ORDER_OPTIONS)
    .obs('lang')
    .obs('subject')
    .obs('body')
    .obs('eventIds[]');

  self.totalMinutesObs = ko.computed(function() {
    var sum = self.assessmentsObs()
      .map(asmt => asmt.minutesToComplete).reduce((a,  b) => a + b, 0);
    if (sum < 1) {
      return '';
    } else if (sum === 1) {
      return ' (1 minute)';
    } else {
      return ' (' + sum + ' minutes)';
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
      let array = moveArrayItem(sessionsObs(), index, index-1);
      sessionsObs(array);
    }
  }
  self.moveSessionDown = function(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index < sessionsObs().length) {
      let array = moveArrayItem(sessionsObs(), index, index+1);
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
  self.openAssessmentDialog = function() {
    root.openDialog("select_assessment_refs", {
      selected: self.assessmentsObs(),
      addAssessmentRefs: (assessments) => {
        self.assessmentsObs(assessments);
        root.closeDialog();
      }
    });
  }
  self.addWindow = function() {
    self.timeWindowsObs.push({
      'startTime': '08:00'
    });
  }
  self.addMessage = function() {
    self.messagesObs.push({});
  }
  self.addLabel = function() {
    self.labelsObs.push({});
  }

  getEventIds().then(array => {
    self.eventIdsObs(array);
    setTimeout(() => self.startEventIdObs(session.startEventId), 1);
  });  
}