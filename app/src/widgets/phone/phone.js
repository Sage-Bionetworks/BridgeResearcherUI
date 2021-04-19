import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";

// TODO: Check what happens if you sign up with a phone number that has US country code
// with a Nigerian phone number

export default function(params) {
  let self = this;

  let phone = params.phoneObs();
  if (!phone) {
    phone = {number: '', regionCode: 'US'};
  }

  new Binder(self)
    .obs("phoneNumber", phone.number)
    .obs("phoneRegion", phone.regionCode)
    .obs('countries', fn.SUPPORTED_COUNTRIES);

  self.phoneNumberObs.subscribe(newValue => {
    params.phoneObs({regionCode: self.phoneRegionObs(), number: newValue});
  });
  self.phoneRegionObs.subscribe(newValue => {
    params.phoneObs({regionCode: newValue, number: self.phoneNumberObs()});
  });
  self.updateRegion = function(model, event) {
    let context = ko.contextFor(event.target);
    if (context && context.$index) {
      let item = fn.SUPPORTED_COUNTRIES[context.$index()];
      self.phoneRegionObs(item.regionCode);
    }
  };
};