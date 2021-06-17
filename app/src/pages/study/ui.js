import Binder from "../../binder";
import fn from "../../functions";
import BaseStudy from "./base_study";

export default class StudyUi extends BaseStudy {
  constructor(params) {
    super(params, 'study-ui');
    fn.copyProps(self, fn, "formatDateTime");

    this.binder
      .bind("contacts[]", [], null, Binder.persistArrayWithBinder)
      .bind("studyLogoUrl")
      .bind("background", null, 
        Binder.fromObjectField("colorScheme", "background"),
        Binder.toObjectField("colorScheme", "background"))
      .bind("foreground", null, 
        Binder.fromObjectField("colorScheme", "foreground"),
        Binder.toObjectField("colorScheme", "foreground"))
      .bind("activated", null, 
        Binder.fromObjectField("colorScheme", "activated"),
        Binder.toObjectField("colorScheme", "activated"))
      .bind("inactivated", null, 
        Binder.fromObjectField("colorScheme", "inactivated"),
        Binder.toObjectField("colorScheme", "inactivated"));

    super.load();
  }
  addContact() {
    this.contactsObs.push({address: {}});
  }
}
