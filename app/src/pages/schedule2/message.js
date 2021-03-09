import Binder from "../../binder";
import ko from "knockout";

export default function(params) {
  var self = this;
  var message = params.message;
  var messagesObs = params.messagesObs;
  var index = messagesObs().indexOf(message);
  self.prefix = params.prefix + '_messages' + index;

  message.binder = new Binder(self)
    .bind('language', message.language)
    .bind('subject', message.subject)
    .bind('body', message.body);

  self.generateId = function(fieldName) {
    return `${self.prefix}_${fieldName}`;
  }
  self.removeMessage = function(vm, event) {
    let $context = ko.contextFor(event.target);
    messagesObs.remove(messagesObs()[$context.$index()]);
  }
}