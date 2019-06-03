import SmsViewModel from "./sms_view_model";
import ko from "knockout";

export default class SmsVerifyPhoneTemplate extends SmsViewModel {
  constructor() {
    super("verifyPhoneSmsTemplate");
    this.autoVerificationPhoneEnabledObs = ko.observable();
  }
  postLoad(study) {
    this.autoVerificationPhoneEnabledObs(!study.autoVerificationPhoneSuppressed);
  }
  preSave(study) {
    study.autoVerificationPhoneSuppressed = !this.autoVerificationPhoneEnabledObs();
  }
};
