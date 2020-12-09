import ko from "knockout";
import optionsService from "../../services/options_service";

export default function breadcrumb(params) {
  let self = this;

  self.orgNames = {}
  self.orgIdObs = ko.observable(params.orgId);
  self.orgNameObs = ko.observable('');

  optionsService.getOrganizationNames().then((response) => {
    self.orgNames = response;
    self.orgNameObs(self.orgNames[params.orgId]);
  });
};
