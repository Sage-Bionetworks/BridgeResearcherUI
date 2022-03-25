import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

const CREATE_MSG = "Please enter your Synapse user account ID\n(you'll be made the administrator of the project):";
const EXPORT_MSG = "Unexported app data is being exported to Synapse.\n" +
  "This can take some time.\nVisit your project in Synapse to see your newly uploaded data.";
function exportingMsg() {
  alerts.notification("Starting Data Export", EXPORT_MSG);
}

export default function exportSettings() {
  let self = this;

  let binder = new Binder(self)
    .bind("synapseDataAccessTeamId")
    .bind("synapseProjectId")
    .bind("usesCustomExportSchedule")
    .bind("uploadValidationStrictness", "warning")
    .bind("disableExport");

  fn.copyProps(self, root, "isDeveloper");

  self.isLinked = ko.computed(function() {
    return fn.isNotBlank(self.synapseProjectIdObs()) || fn.isNotBlank(self.synapseDataAccessTeamIdObs());
  });
  self.projectLinkObs = ko.computed(function() {
    let value = self.synapseProjectIdObs();
    return value ? utils.getSynapseServer() + "Synapse:" + value : null;
  });
  self.teamLinkObs = ko.computed(function() {
    let value = self.synapseDataAccessTeamIdObs();
    return value ? utils.getSynapseServer() + "Team:" + value : null;
  });
  self.startExport = function(self, event) {
    utils.startHandler(self, event);

    serverService.startExport()
      .then(utils.successHandler(self, event))
      .then(exportingMsg)
      .catch(utils.failureHandler({ transient: false, id: 'app-export-v3' }));
  };
  self.createSynapseProject = function(vm, event) {
    alerts.prompt(CREATE_MSG, function(synapseUserId) {
      utils.startHandler(self, event);
      serverService.createSynapseProject(synapseUserId)
        .then(fn.handleObsUpdate(self.synapseDataAccessTeamIdObs, "teamId"))
        .then(fn.handleObsUpdate(self.synapseProjectIdObs, "projectId"))
        .then(utils.successHandler(vm, event, "Synapse information created."))
        .catch(utils.failureHandler({ transient: false, id: 'app-export-v3' }));
    });
  };
  self.save = function(vm, event) {
    utils.startHandler(self, event);
    self.app = binder.persist(self.app);

    serverService.saveApp(self.app)
      .then(utils.successHandler(vm, event, "Synapse information saved."))
      .catch(utils.failureHandler({ id: 'app-export-v3' }));
  };

  serverService.getApp()
    .then(binder.assign("app"))
    .then(binder.update())
    .catch(utils.failureHandler({ id: 'app-export-v3' }));
};
exportSettings.prototype.dispose = function() {
  this.isLinked.dispose();
  this.projectLinkObs.dispose();
  this.teamLinkObs.dispose();
};
