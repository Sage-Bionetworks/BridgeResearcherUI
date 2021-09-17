import Binder from "../../../binder";
import ko from "knockout";
import serverService from "../../../services/server_service";
import utils from "../../../utils";

const SYNAPSE_ADMINS = [
   { name: "Alx Dark", id: "2026857", obs: "darkObs" }
  ,{ name: "Erin Mounts", id: "3342639", obs: "mountsObs" }
  ,{ name: "Dan Webster", id: "3373388", obs: "websterObs" }
  ,{ name: "Sonia Carlson", id: "3418713", obs: "carlsonObs" }
  ,{ name: "Larsson Omberg", id: "372127", obs: "ombergObs" }
  ,{ name: "Solly Sieberts", id: "273959", obs: "siebertsObs" }
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
    .bind("title", "New App")
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
      synapseUserIdObs: ko.observable(),
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
    let app = binder.persist({});

    app.uploadMetadataFieldDefinitions = UPLOAD_SHARED_METADATA_FIELD_DEFS;

    utils.startHandler(vm, event);

    serverService.getSession().then(session => {
        app.supportEmail = session.email;
        app.technicalEmail = session.email;
        app.consentNotificationEmail = session.email;
        app.dataGroups = ["test_user"];
        delete app.allRoles;
        delete app.users;
        let adminIds = SYNAPSE_ADMINS.filter(admin => self[admin.obs]()).map(admin => admin.id);

        let userPromises = self.usersObs().map(function(user) {
          let userObj = {
            email: user.emailObs(),
            firstName: user.firstNameObs(),
            lastName: user.lastNameObs(),
            synapseUserId: user.synapseUserIdObs(),
            roles: user.rolesObs(),
            dataGroups: ["test_user"]
          };
          if (userObj.synapseUserId) {
            return utils.synapseAliasToUserId(userObj.synapseUserId).then((id) => {
              userObj.synapseUserId = id;
              return userObj;
            });
          } else {
            return Promise.resolve(userObj);
          }
        });
        return Promise.all(userPromises).then(
          (users) => serverService.createApp({ app, adminIds, users }));
      })
      .then(utils.successHandler(vm, event, "App created."))
      .then(() => window.location = `#/admin/apps/${self.identifierObs()}`)
      .catch(utils.failureHandler({id: 'app'}));
  };
  function load() {
    return params.id === "new" ? Promise.resolve({}) : serverService.getAppById(params.id);
  }

  load().then(binder.assign("app"))
    .then(binder.update())
    .then((res) => {
      if (params.id !== 'new') {
        self.titleObs(res.name);
      }
    })
    .then(self.addUser(0));
};
