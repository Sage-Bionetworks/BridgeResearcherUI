import Binder from "../../binder";
import BaseAssessment from "./base_assessment.js";

export default class AssessmentUi extends BaseAssessment {
  constructor(params) {
    super(params, 'assessment-ui');

    this.binder
      .bind("version")
      .bind("identifier")
      .bind("ownerId")
      .bind("minutesToComplete")
      .bind('labels[]', null, null, Binder.persistArrayWithBinder)
      .bind("background", null, Binder.fromObjectField("colorScheme", "background"),
          Binder.toObjectField("colorScheme", "background"))
      .bind("foreground", null, Binder.fromObjectField("colorScheme", "foreground"),
          Binder.toObjectField("colorScheme", "foreground"))
      .bind("activated", null, Binder.fromObjectField("colorScheme", "activated"),
          Binder.toObjectField("colorScheme", "activated"))
      .bind("inactivated", null, Binder.fromObjectField("colorScheme", "inactivated"),
          Binder.toObjectField("colorScheme", "inactivated"))
      .obs("canEdit", false);

    super.load()
      .catch(this.failureHandler);
  }
  addLabel() {
    this.labelsObs.push({});
  }
}