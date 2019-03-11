import EmailViewModel from "./email_view_model";

module.exports = class AppInstallLinkTemplate extends EmailViewModel {
  constructor() {
    super("appInstallLinkTemplate");
  }
  postLoad(study) {
    this.autoVerificationEnabledObs(!study.autoVerificationEmailSuppressed);
  }
  preSave(study) {
    study.autoVerificationEmailSuppressed = !this.autoVerificationEnabledObs();
  }
};
