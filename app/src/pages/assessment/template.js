import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import config from "../../config";
import ko from "knockout";
import BaseAssessment from "./base_assessment.js";

export default class AssessmentTemplate extends BaseAssessment {
  constructor(params) {
    super(params, 'assessment-template');

    this.binder
      .obs("editors[]")
      . bind("customizationFields", null, 
        Binder.fromCustomizationFields, Binder.toCustomizationFields);

    super.load();
  }
  addEditor() {
    let editor = {
      propNameObs: ko.observable(),
      labelObs: ko.observable(),
      descriptionObs: ko.observable(),
      propTypeObs: ko.observable(),
      propTypeOptions: config.assessmentPropTypes,
      identifierObs: ko.observable()
    }
    this.editorsObs.push(editor);
  }
  removeEditor(editor, event) {
    alerts.deleteConfirmation("Are you sure you wish to delete this?", () => {
      this.editorsObs.remove(editor);
    }, "Delete");
  }
}
