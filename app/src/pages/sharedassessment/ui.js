import Binder from "../../binder";
import utils from "../../utils";
import BaseSharedAssessment from "./base_shared_assessment";

export default class SharedAssessmentUi extends BaseSharedAssessment {
  constructor(params) {
    super(params, 'sharedassessment-ui');

    this.binder
      .bind("identifier")
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

    super.load();
  }
  save(vm, event) {
    this.assessment = this.binder.persist(this.assessment);

    utils.startHandler(vm, event);
    this.saveAssessment()
      .then(utils.successHandler(vm, event, "Shared assessment has been saved."))
      .catch(this.failureHandler);
  }
  addLabel() {
    this.labelsObs.push({});
  }
}
