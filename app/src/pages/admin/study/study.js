import Binder from "../../../binder";
import ko from "knockout";
import serverService from "../../../services/server_service";
import utils from "../../../utils";

const SYNAPSE_ADMINS = [
  { name: "Alx Dark", id: "2026857", obs: "darkObs" },
  { name: "Brian Bot", id: "273979", obs: "botObs" },
  { name: "Mike Kellen", id: "273984", obs: "kellenObs" },
  { name: "Dan Webster", id: "3373388", obs: "websterObs" }
];
const UPLOAD_SHARED_METADATA_FIELD_DEFS = [
  { name: "taskIdentifier", maxLength: 100, type: "string" },
  { name: "rsdFrameworkVersion", maxLength: 100, type: "string" },
  { name: "startDate", type: "timestamp" },
  { name: "endDate", type: "timestamp" },
  { name: "taskRunUUID", maxLength: 100, type: "string" },
  { name: "deviceTypeIdentifier", maxLength: 100, type: "string" },
  { name: "dataGroups", maxLength: 100, type: "string" },
  { name: "appVersion", maxLength: 100, type: "string" },
  { name: "deviceInfo", maxLength: 100, type: "string" }
];

export default function(params) {
  let self = this;

  let binder = new Binder(self)
    .bind("title", "New Study")
    .bind("name")
    .bind("sponsorName")
    .bind("supportEmail")
    .bind("technicalEmail")
    .bind("consentNotificationEmail")
    .bind("users[]", [])
    .bind("allRoles[]", ["Developer", "Researcher"])
    .bind("identifier")
    .bind("id", params.id === "new" ? null : params.id);

  SYNAPSE_ADMINS.forEach(function(admin) {
    self[admin.obs] = ko.observable(false);
  });

  self.addUser = function(index) {
    self.usersObs.splice(index + 1, 0, {
      emailObs: ko.observable(),
      firstNameObs: ko.observable(),
      lastNameObs: ko.observable(),
      rolesObs: ko.observableArray([])
    });
  };
  self.addBelow = function(item, event) {
    self.addUser(self.usersObs().indexOf(item));
  };
  self.addFirstRow = function() {
    self.addUser(0);
  };
  self.save = function(vm, event) {
    let study = binder.persist({});

    study.uploadMetadataFieldDefinitions = UPLOAD_SHARED_METADATA_FIELD_DEFS;

    utils.startHandler(vm, event);

    serverService
      .getSession()
      .then(session => {
        study.supportEmail = session.email;
        study.technicalEmail = session.email;
        study.consentNotificationEmail = session.email;
        study.dataGroups = ["test_user"];
        delete study.allRoles;
        delete study.users;

        let users = self.usersObs().map(function(user) {
          return {
            email: user.emailObs(),
            firstName: user.firstNameObs(),
            lastName: user.lastNameObs(),
            roles: user.rolesObs(),
            dataGroups: ["test_user"]
          };
        });
        let adminIds = SYNAPSE_ADMINS.filter(admin => self[admin.obs]()).map(admin => admin.id);

        return serverService.createStudy({ study, adminIds, users });
      })
      .then(utils.successHandler(vm, event, "Study created."))
      .then(() => self.titleObs(self.nameObs()))
      .catch(utils.failureHandler({id: 'study'}));
  };
  function load() {
    return params.id === "new" ? Promise.resolve({}) : serverService.getStudyById(params.id);
  }

  load()
    .then(binder.assign("study"))
    .then(binder.update())
    .then(self.addUser(0));
};
