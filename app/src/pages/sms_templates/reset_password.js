import SmsViewModel from "./sms_view_model";

module.exports = class SmsResetPasswordTemplate extends SmsViewModel {
  constructor() {
    super("resetPasswordSmsTemplate");
  }
  getSampleURL() {
    return "https://ws.sagebridge.org/rp?study=" + this.study.identifier + "&sptoken=#####################";
  }
};
