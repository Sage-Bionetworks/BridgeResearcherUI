import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";
import BaseStudy from "./base_study";

const EXPORT_CONFIG = 'exporter3Configuration';

export default class StudyExport extends BaseStudy {
  constructor(params) {
    super(params, 'study-export');

    fn.copyProps(this, root, 'isDeveloper', 'isStudyDesigner');

    let project = Binder.objPropDelegates(EXPORT_CONFIG, 'projectId');
    let dataAccessTeam = Binder.objPropDelegates(EXPORT_CONFIG, 'dataAccessTeamId');
    let participantVersionTable = Binder.objPropDelegates(EXPORT_CONFIG, 'participantVersionTableId');
    let rawDataFolder = Binder.objPropDelegates(EXPORT_CONFIG, 'rawDataFolderId');
    let storageLocation = Binder.objPropDelegates(EXPORT_CONFIG, 'storageLocationId');

    this.binder.obs("name");
    this.binder.bind('exporter3Enabled', null, (v) => !v, (v) => !v);
    this.binder.bind('projectId', null, project.fromObject, project.toObject);
    this.binder.bind('dataAccessTeamId', null, 
      dataAccessTeam.fromObject, dataAccessTeam.toObject);
    this.binder.bind('participantVersionTableId', null, 
      participantVersionTable.fromObject, participantVersionTable.toObject);
    this.binder.bind('rawDataFolderId', null, 
      rawDataFolder.fromObject, rawDataFolder.toObject);
    this.binder.bind('storageLocationId', null, 
      storageLocation.fromObject, storageLocation.toObject);

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
    super.load();
  }
  createSynapseProject(vm, event) {
    utils.startHandler(vm, event);
    serverService.createSynapseProjectForStudy(this.studyId)
      .then(fn.handleObsUpdate(this.projectIdObs, "projectId"))
      .then(fn.handleObsUpdate(this.dataAccessTeamIdObs, "dataAccessTeamId"))
      .then(fn.handleObsUpdate(this.participantVersionTableIdObs, "participantVersionTableId"))
      .then(fn.handleObsUpdate(this.rawDataFolderIdObs, "rawDataFolderId"))
      .then(fn.handleObsUpdate(this.storageLocationIdObs, "storageLocationId"))
      .then(utils.successHandler(vm, event, "Synapse information created."))
      .catch(utils.failureHandler({ transient: false, id: 'study-export' }));
  }
  save (vm, event) {
    utils.clearErrors();

    utils.startHandler(vm, event);
    this.study = this.binder.persist(this.study);

    serverService.updateStudy(this.study)
      .then(res => this.study.version = res.version)
      .then(utils.successHandler(vm, event, "Study updated."))
      .catch(this.failureHandler);
  }
}
StudyExport.prototype.dispose = function() {
  this.isLinked.dispose();
  this.projectLinkObs.dispose();
  this.teamLinkObs.dispose();
};