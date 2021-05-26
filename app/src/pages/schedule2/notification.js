import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import ko from "knockout";

const NOTIFY_AT_OPTIONS = [
  {text: 'After window start', value: 'after_window_start'},
  {text: 'Before window end', value: 'before_window_end'}
];

export default function(params) {
  var self = this;
  var notification = params.notification;
  var notificationsObs = params.notificationsObs;
  var index = notificationsObs().indexOf(notification);
  self.prefix = params.prefix + '_notifications' + index;

  notification.binder = new Binder(self)
    .bind('notifyAt', notification.notifyAt || 'after_window_start')
    .bind('offset', notification.offset || "PT0M")
    .bind('interval', notification.interval)
    .bind('allowSnooze', notification.allowSnooze)
    .bind('messages[]', notification.messages, null, Binder.persistArrayWithBinder)
    .obs('notifyAtTypes', NOTIFY_AT_OPTIONS);

    self.generateId = function(fieldName) {
    return `${self.prefix}_${fieldName}`;
  }
  self.addMessage = function() {
    self.messagesObs.push({});
  }
  self.removeNotification = function(vm, event) {
    alerts.deleteConfirmation("Are you sure?", function() {
      let $context = ko.contextFor(event.target);
      notificationsObs.remove(notificationsObs()[$context.$index()]);
    });
  }
}