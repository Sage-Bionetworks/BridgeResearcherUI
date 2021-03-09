import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import ko from "knockout";
import scheduleFormatter from "../../schedule_formatter";

export default function(params) {
  var self = this;
  var timeWindow = params.timeWindow;
  var timeWindowsObs = params.timeWindowsObs;
  var index = timeWindowsObs().indexOf(timeWindow);
  self.prefix = params.prefix + '_timeWindows' + index;
  
  // This is needed by fadeRemove, which needs a reference to the whole object
  // in a binding
  self.timeWindow = timeWindow
  self.timeOptions = scheduleFormatter.timeOptions;


  timeWindow.binder = new Binder(self)
    .bind('guid', timeWindow.guid)
    .bind('startTime', timeWindow.startTime)
    .bind('expiration', timeWindow.expiration)
    .bind('persistent', timeWindow.persistent);

  self.generateId = function(fieldName) {
    return `${self.prefix}_${fieldName}`;
  }

  self.moveWindowUp = function(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index > 0) {
      let array = moveArrayItem(timeWindowsObs(), index, index-1);
      timeWindowsObs(array);
    }
  }
  self.moveWindowDown = function(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index < timeWindowsObs().length) {
      let array = moveArrayItem(timeWindowsObs(), index, index+1);
      timeWindowsObs(array);
    }
  }
  self.addBelow = function(vm, event) {
    timeWindowsObs.push({ 'startTime': null });
  }
}