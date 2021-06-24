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

export default function(params) {
  let self = this;

  self.canEdit = params.canEdit;
  var contactsObs = params.contactsObs;
  var contact = params.contact;
  contact.address = contact.address || {};
  var index = contactsObs().indexOf(contact);

  contact.binder = new Binder(self)
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
    .bind('state', contact.address.state, 
      Binder.fromObjectField("address", "state"), 
      Binder.toObjectField("address", "state"))
    .bind('postalCode', contact.address.postalCode, 
      Binder.fromObjectField("address", "postalCode"), 
      Binder.toObjectField("address", "postalCode"))
    .bind('country', contact.address.country, 
      Binder.fromObjectField("address", "country"), 
      Binder.toObjectField("address", "country"));

  self.generateId = function(fieldName) {
    return `contacts${index}_${fieldName}`;
  }
  self.remove = function(vm, event) {
    alerts.deleteConfirmation("Are you sure? We cannot undo this.", function() {
      let $context = ko.contextFor(event.target);
      contactsObs.remove(contactsObs()[$context.$index()]);
    }, "Delete");    
  }
  self.moveUp = function(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index > 0) {
      let array = fn.moveArrayItem(contactsObs(), index, index-1);
      contactsObs(array);
    }
  }
  self.moveDown = function(vm, event) {
    let index = ko.contextFor(event.target).$index();
    if (index < contactsObs().length) {
      let array = fn.moveArrayItem(contactsObs(), index, index+1);
      contactsObs(array);
    }
  }
  self.firstOpacityObs = function(index) {
    return index === 0 ? .5 : 1;
  };
  self.lastOpacityObs = function(index) {
    return index === (contactsObs().length-1) ? .5 : 1;
  };
  self.toggleAddress = function() {
    self.addressVisibleObs( !self.addressVisibleObs() );
  };
  self.togglePerson = function() {
    self.personVisibleObs( !self.personVisibleObs() );
  };
  self.formatRole = function(role) {
    let opt = ROLE_OPTS.filter(opt => opt.value === role);
    return (opt.length) ? opt[0].label : '';
  }
};
