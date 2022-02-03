import BaseStudy from "./base_study";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";

const SIGN_IN_TYPES = [
  {label: 'Email and password', value: 'email_password', obs: 'emailPasswordObs'},
  {label: 'Phone number and password', value: 'phone_password', obs: 'phonePasswordObs'},
  {label: 'External ID and password', value: 'external_id_password', obs: 'externalIdPasswordObs'},
  {label: 'Send an email message', value: 'email_message', obs: 'emailMessageObs'},
  {label: 'Send an SMS (phone) message', value: 'phone_message', obs: 'phoneMessageObs'}
];

export default class StudyUi extends BaseStudy {
  constructor(params) {
    super(params, 'study-ui', 'ui');
    fn.copyProps(this, fn, "formatDateTime");

    let toSignInTypes = () => {
      return SIGN_IN_TYPES.filter(type => this[type.obs]()).map(type => type.value);
    }
    let fromSignInTypes = (value = []) => {
      SIGN_IN_TYPES.forEach(type => this[type.obs](value.includes(type.value)));
    }
    SIGN_IN_TYPES.forEach(value => {
      this[value.obs] = ko.observable();
    });

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
  image(imageLogoUrl) {
    let src = '/images/globe.svg';
    let size = '50%';
    if (imageLogoUrl) {
      src = imageLogoUrl;
      size = 'contain';
    }
    return { 
      'height': '15rem',
      'background-repeat': 'no-repeat',
      'background-position': 'center',
      'background-size': size,
      'background-image': 'url('+src+')',
      'border': '1px solid silver'
    };
  }
  uploadLogo(vm, event) {
    root.openDialog("file_upload", {
      closeFunc: this.closeUploadDialog.bind(this),
      studyId: this.studyId,
      guid: 'logo',
      disposition: 'inline'
    });
  }
  closeUploadDialog() {
    root.closeDialog();
    this.load();
  }
}
