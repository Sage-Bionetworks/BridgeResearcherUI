import NotificationsBaseAccount from "../../accounts/notifications_base_account";
import root from "../../root";
import serverService from "../../services/server_service";

export default class NotificationsParticipant extends NotificationsBaseAccount {
  constructor(params) {
    super({
      ...params, 
      errorId: 'studyparticipant-notifications',
      notFoundParams: {
        redirectTo: `#/studies/${params.studyId}/participants`,
        redirectMsg: "Participant not found"
      }
    });
    serverService.getStudy(params.studyId).then(res => this.navStudyNameObs(res.name));
  }
  getAccountNotifications() {
    return serverService.getStudyParticipantNotifications(this.studyId, this.userId);
  }
  getAccountRecentSms() {
    return serverService.getStudyParticipantRecentSmsMessage(this.studyId, this.userId);
  }
  loadAccount() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  sendNotification() {
    root.openDialog("send_notification", {studyId: this.studyId, userId: this.userId});
  }
}