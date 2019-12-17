import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function notifications(params) {
  let self = this;

  fn.copyProps(self, root, "isDeveloper", "isResearcher", "isAdmin", "notificationsEnabledObs");
  self.formatDate = fn.formatDateTime;

  new Binder(self)
    .obs("name", "")
    .obs("userId", params.userId)
    .obs("title", "&#160;")
    .obs("isRegistered", false)
    .obs("status")
    .obs("hasPhone", false)
    .obs("items[]")
    .obs('smsType')
    .obs('messageId')
    .obs('messageBody')
    .obs('sentOn');

  serverService.getParticipantName(params.userId)
    .then(function(part) {
      self.titleObs(part.name);
      self.nameObs(part.name);
      self.statusObs(part.status);
    })
    .catch(utils.failureHandler({ id: 'notifications' }));

  tables.prepareTable(self, { 
    name: "notification registration",
    id: 'notifications'
  });

  self.sendNotification = function() {
    root.openDialog("send_notification", {
      userId: params.userId
    });
  };
  self.sendSmsMessage = function() {
    root.openDialog("send_sms_message", {
      userId: params.userId
    });
  };

  function load() {
    serverService.getParticipant(params.userId)
      .then(participant => {
        self.hasPhoneObs(participant.phone != null);
        return participant.id;
      })
      .then(serverService.getParticipantNotifications.bind(serverService))
      .then(function(response) {
        self.isRegisteredObs(response.items.length > 0);
        self.itemsObs(response.items);
      })
      .then(() => {
        if (self.isAdmin()) {
          serverService.getParticipantRecentSmsMessage(params.userId).then((response) => {
            self.smsTypeObs(response.smsType);
            self.messageIdObs(response.messageId);
            self.messageBodyObs('“' + response.messageBody + '”');
            self.sentOnObs(response.sentOn);
          });
        }
      })
      .catch(utils.failureHandler({ id: 'notifications' }));
  }
  load();
};
