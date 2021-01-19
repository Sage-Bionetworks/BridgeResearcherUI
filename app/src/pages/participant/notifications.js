import NotificationsBaseAccount from "../../accounts/notifications_base_account";
import serverService from "../../services/server_service";

export default class ParticipantNotifications extends NotificationsBaseAccount {
  constructor(params) {
    super({
      ...params, 
      errorId: 'notifications',
      notFoundParams: {
        redirectTo: 'participants', 
        redirectMsg: 'Participant not found'
      }
    });
  }
  loadAccount() { 
    return serverService.getParticipant(this.userId);
  }
  sendNotification() {
    root.openDialog("send_notification", {userId: this.userId});
  }
};
