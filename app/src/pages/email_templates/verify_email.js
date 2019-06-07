import EmailViewModel from "./email_view_model";
import ko from "knockout";

export default class VerifyEmailTemplate extends EmailViewModel {
  constructor() {
    super("verifyEmailTemplate");
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
