import Binder from "../binder";
import fn from "../functions";
import root from "../root";
import serverService from "../services/server_service";
import tables from "../tables";
import utils from "../utils";
import BaseAccount from "./base_account";

export default class NotificationsBaseAccount extends BaseAccount {
  constructor(params) {
    super(params);

    fn.copyProps(this, root, "notificationsEnabledObs");
    fn.copyProps(this, fn, "formatDate");

    new Binder(this)
      .obs("name", "")
      .obs("isRegistered", false)
      .obs("hasPhone", false)
      .obs('smsType')
      .obs('messageId')
      .obs('messageBody')
      .obs('sentOn');

    tables.prepareTable(this, { 
      name: "notification registration",
      id: this.errorId
    });
    this.load();
  }
  loadAccount() { 
    return serverService.getParticipant(this.userId);
  }
  sendNotification() {
    throw new Error('resendAccountEmailVerification not implemented');
  }
  getAccountNotifications() {
    return serverService.getParticipantNotifications(this.userId);
  }
  getAccountRecentSms() {
    return serverService.getParticipantRecentSmsMessage(this.userId);
  }
  afterGetParticipant(participant) {
    this.hasPhoneObs(participant.phone != null);
    return this.getAccountNotifications();
  }
  afterGetParticipantNotifications(response) {
    this.isRegisteredObs(response.items.length > 0);
    this.itemsObs(response.items);
  }
  loadRecentSmsMessage() {
    if (this.isAdmin() && this.hasPhoneObs()) {
      return this.getAccountRecentSms().then(response => {
        this.smsTypeObs(response.smsType);
        this.messageIdObs(response.messageId);
        this.messageBodyObs('“' + response.messageBody + '”');
        this.sentOnObs(response.sentOn);
      });
    }
    return Promise.resolve();
  }
  load() {
    this.getAccount()
      .then(this.afterGetParticipant.bind(this))
      .then(this.afterGetParticipantNotifications.bind(this))
      .then(this.loadRecentSmsMessage.bind(this))
      .then(utils.successHandler(this))
      .catch(utils.failureHandler(this.failureParams));
  }
}