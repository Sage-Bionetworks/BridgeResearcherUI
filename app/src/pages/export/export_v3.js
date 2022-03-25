import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

const EXPORT_CONFIG = 'exporter3Configuration';

export default class ExportSettingsV3 {
  constructor(params) {
    this.app = {};
    this.failureHandler = utils.failureHandler({
      transient: false,
      id: 'app-export-v3'
    });

    fn.copyProps(this, root, 'isDeveloper', 'isStudyDesigner');

    let project = Binder.objPropDelegates(EXPORT_CONFIG, 'projectId');
    let dataAccessTeam = Binder.objPropDelegates(EXPORT_CONFIG, 'dataAccessTeamId');
    let participantVersionTable = Binder.objPropDelegates(EXPORT_CONFIG, 'participantVersionTableId');
    let rawDataFolder = Binder.objPropDelegates(EXPORT_CONFIG, 'rawDataFolderId');
    let storageLocation = Binder.objPropDelegates(EXPORT_CONFIG, 'storageLocationId');

    this.binder = new Binder(this)
      .bind('exporter3Enabled', null, (v) => !v, (v) => !v)
      .bind('projectId', null, project.fromObject, project.toObject)
      .bind('dataAccessTeamId', null, 
        dataAccessTeam.fromObject, dataAccessTeam.toObject)
      .bind('participantVersionTableId', null, 
        participantVersionTable.fromObject, participantVersionTable.toObject)
      .bind('rawDataFolderId', null, 
        rawDataFolder.fromObject, rawDataFolder.toObject)
      .bind('storageLocationId', null, 
        storageLocation.fromObject, storageLocation.toObject)

    this.isLinked = ko.computed(() => 
      fn.isNotBlank(this.projectIdObs()) || fn.isNotBlank(this.dataAccessTeamIdObs()));
    this.projectLinkObs = ko.computed(() => {
      let value = this.projectIdObs();
      return value ? `${utils.getSynapseServer()}Synapse:${value}` : null;
    });
    this.teamLinkObs = ko.computed(() => {
      let value = this.dataAccessTeamIdObs();
      return value ? `${utils.getSynapseServer()}Team:${value}` : null;
    });

    serverService.getApp()
      .then(this.binder.assign("app"))
      .then(this.binder.update())
      .catch(utils.failureHandler({ id: 'app-export-v2' }));
  }
  createSynapseProject(vm, event) {
    utils.startHandler(vm, event);
    serverService.createSynapseProjectForApp()
      .then(fn.handleObsUpdate(this.projectIdObs, "projectId"))
      .then(fn.handleObsUpdate(this.dataAccessTeamIdObs, "dataAccessTeamId"))
      .then(fn.handleObsUpdate(this.participantVersionTableIdObs, "participantVersionTableId"))
      .then(fn.handleObsUpdate(this.rawDataFolderIdObs, "rawDataFolderId"))
      .then(fn.handleObsUpdate(this.storageLocationIdObs, "storageLocationId"))
      .then(utils.successHandler(vm, event, "Synapse information created."))
      .catch(utils.failureHandler({ transient: false, id: 'app-export-v3' }));
  }
  save (vm, event) {
    utils.clearErrors();

    utils.startHandler(vm, event);
    this.app = this.binder.persist(this.app);

    serverService.saveApp(this.app)
      .then(res => this.app.version = res.version)
      .then(utils.successHandler(vm, event, "App updated."))
      .catch(this.failureHandler);
  }
}
ExportSettingsV3.prototype.dispose = function() {
  this.isLinked.dispose();
  this.projectLinkObs.dispose();
  this.teamLinkObs.dispose();
};