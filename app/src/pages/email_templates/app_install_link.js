import EmailViewModel from "./email_view_model";
import ko from "knockout";

module.exports = class AppInstallLinkTemplate extends EmailViewModel {
  constructor() {
    super("appInstallLinkTemplate");
    this.autoVerificationEnabledObs = ko.observable();
    this.autoVerificationEnabledObs.subscribe(newValue => {
      if (this.editor) {
        this.editor.setReadOnly(!newValue);
      }
    });
  }
  postLoad(study) {
    this.autoVerificationEnabledObs(!study.autoVerificationEmailSuppressed);
  }
  preSave(study) {
    study.autoVerificationEmailSuppressed = !this.autoVerificationEnabledObs();
  }
};
