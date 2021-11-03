import ko from "knockout";
import optionsService from "../../services/options_service";
import root from "../../root";

export default function breadcrumb(params) {
  let self = this;

  self.orgNames = {}
  self.orgIdObs = ko.observable(params.orgId);
  self.orgNameObs = ko.observable('');

  self.getOrgLink = function(obs) {
    return `/organizations/${obs()}/general`;
  }
  self.getMembersLink = function(obs) {
    return `/organizations/${obs()}/members`;
  }

  optionsService.getOrganizationNames().then((response) => {
    self.orgNames = response;
    self.orgNameObs(self.orgNames[params.orgId]);
  });
};
