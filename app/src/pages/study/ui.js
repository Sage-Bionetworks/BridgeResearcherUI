import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import BaseStudy from "./base_study";

const SIGN_IN_TYPES = [
  {label: 'Email and password', value: 'email_password', obs: 'emailPasswordObs'},
  {label: 'Phone number and password', value: 'phone_password', obs: 'phonePasswordObs'},
  {label: 'External ID and password', value: 'external_id_password', obs: 'externalIdPasswordObs'},
  {label: 'Send an email message', value: 'email_message', obs: 'emailMessageObs'},
  {label: 'Send an SMS (phone) message', value: 'phone_message', obs: 'phoneMessageObs'}
];

export default class StudyUi extends BaseStudy {
  constructor(params) {
    super(params, 'study-ui');
    fn.copyProps(self, fn, "formatDateTime");

    let toSignInTypes = () => {
      return SIGN_IN_TYPES.filter(type => this[type.obs]()).map(type => type.value);
    }
    let fromSignInTypes = (value = []) => {
      SIGN_IN_TYPES.forEach(type => this[type.obs](value.includes(type.value)));
    }
    SIGN_IN_TYPES.forEach(value => {
      this[value.obs] = ko.observable();
    })

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
        Binder.toObjectField("colorScheme", "inactivated"))
      .bind('signInTypes[]', null, fromSignInTypes, toSignInTypes);
    super.load();
  }
  addContact() {
    this.contactsObs.push({address: {}});
  }
}
