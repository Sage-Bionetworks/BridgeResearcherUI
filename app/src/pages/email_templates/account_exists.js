import EmailViewModel from "./email_view_model";
import ko from "knockout";

export default class AccountExistsTemplate extends EmailViewModel {
  constructor() {
    super("accountExistsTemplate");
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
