import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";

const ROLE_OPTS = [
  {label: 'IRB', value: 'irb'},
  {label: 'Principal Investigator', value: 'principal_investigator'},
  {label: 'Investigator', value: 'investigator'},
  {label: 'Sponsor', value: 'sponsor'},
  {label: 'Study Support', value: 'study_support'},
  {label: 'Technical Support', value: 'technical_support'}
];

export default class StudyContact {
  constructor(params) {

    this.canEdit = params.canEdit;
    this.contactsObs = params.contactsObs;
    var contact = params.contact;
    contact.address = contact.address || {};
    this.index = this.contactsObs().indexOf(contact);
      
    contact.binder = new Binder(this)
      .obs('roleOpts', ROLE_OPTS)
      .obs('addressVisible', Object.keys(contact.address).length)
      .obs('personVisible', contact.position || contact.affiliation)
      .bind('name', contact.name)
      .bind('role', contact.role)
      .bind('position', contact.position)
      .bind('affiliation', contact.affiliation)
      .bind('email', contact.email)
      .bind("phone", contact.phone)
      .bind('jurisdiction', contact.jurisdiction)
      .bind('country', contact.country)
      .bind('placeName', contact.address.placeName, 
        Binder.fromObjectField("address", "placeName"), 
        Binder.toObjectField("address", "placeName"))
      .bind('street', contact.address.street, 
        Binder.fromObjectField("address", "street"), 
        Binder.toObjectField("address", "street"))
      .bind('mailRouting', contact.address.mailRouting, 
        Binder.fromObjectField("address", "mailRouting"), 
        Binder.toObjectField("address", "mailRouting"))
      .bind('city', contact.address.city, 
        Binder.fromObjectField("address", "city"), 
        Binder.toObjectField("address", "city"))
      .bind('division', contact.address.division, 
        Binder.fromObjectField("address", "division"), 
        Binder.toObjectField("address", "division"))
      .bind('postalCode', contact.address.postalCode, 
        Binder.fromObjectField("address", "postalCode"), 
        Binder.toObjectField("address", "postalCode"))
      .bind('country', contact.address.country, 
        Binder.fromObjectField("address", "country"), 
        Binder.toObjectField("address", "country")); 
  }
  generateId(fieldName) {
    return `contacts${this.index}_${fieldName}`;
  }
  remove(vm, event) {
    alerts.deleteConfirmation("Are you sure? We cannot undo this.", () => {
      let $context = ko.contextFor(event.target);
      this.contactsObs.remove(this.contactsObs()[$context.$index()]);
    }, "Delete");    
  }
  moveUp(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index > 0) {
      let array = fn.moveArrayItem(this.contactsObs(), index, index-1);
      this.contactsObs(array);
    }
  }
  moveDown(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index < this.contactsObs().length) {
      let array = fn.moveArrayItem(this.contactsObs(), index, index+1);
      this.contactsObs(array);
    }
  }
  firstOpacityObs(index) {
    return index === 0 ? .5 : 1;
  }
  lastOpacityObs(index) {
    return index === (this.contactsObs().length-1) ? .5 : 1;
  }
  toggleAddress() {
    this.addressVisibleObs( !this.addressVisibleObs() );
  }
  togglePerson() {
    this.personVisibleObs( !this.personVisibleObs() );
  }
  formatRole = function(role) {
    let opt = ROLE_OPTS.filter(opt => opt.value === role);
    return (opt.length) ? opt[0].label : '';
  }
}
