import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import Promise from "bluebird";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

function formatReferencedModels(appconfig) {
  let array = [];
  let promises = [];

  promises = promises.concat((appconfig.surveyReferences || []).map(ref => {
    return serverService.getSurvey(ref.guid, ref.createdOn).then(survey => {
      array.push(`survey “${survey.name}” <i>(pub. ${fn.formatDateTime(survey.createdOn)})</i>`);
    });
  }));
  promises = promises.concat((appconfig.schemaReferences || []).map(ref => {
    return serverService.getUploadSchema(ref.id, ref.revision).then(schema => {
      array.push(`schema “${schema.name}” <i>(rev. ${schema.revision})</i>`);
    });
  }));
  promises = promises.concat((appconfig.configReferences || []).map(ref => {
    array.push(`config “${ref.id}” <i>(rev. ${ref.revision})</i>`);
    return Promise.resolve();
  }));
  promises = promises.concat((appconfig.fileReferences || []).map(ref => {
    array.push(`file “${ref.guid}” <i>(rev. ${ref.createdOn})</i>`);
    return Promise.resolve();
    /* This call doesn't currently exist, but I might add it for the file name.
    return serverService.getFileRevision(ref.guid, ref.createdOn).then(fileRev => {
      array.push(`file ${fileRev.name} <i>(pub. ${fn.formatDateTime(fileRev.createdOn)})</i>`);
    });
    */
  }));
  promises = promises.concat((appconfig.assessmentReferences || []).map(ref => {
    let serverCall = (ref.appId === 'shared') ?
      serverService.getSharedAssessment.bind(serverService) :
      serverService.getAssessment.bind(serverService);
      
    return serverCall(ref.guid).then(assessment => {
      let shared = (ref.appId === 'shared') ? 'shared ' : '';
      array.push(`${shared}assessment “${assessment.title}” <i>(rev. ${assessment.revision})</i>`);
    });
  }));
  return Promise.all(promises).then(() => {
    appconfig.refLabel = array.join('; ');
    return Promise.resolve(appconfig);
  });
}

export default function() {
  let self = this;

  self.formatReferencedModels = formatReferencedModels;

  tables.prepareTable(self, {
    name: "app config",
    refresh: load,
    id: "appconfigs",
    delete: (item) => serverService.deleteAppConfig(item.guid, false),
    deletePermanently: (item) => serverService.deleteAppConfig(item.guid, true),
    undelete: (item) => serverService.updateAppConfig(item)
  });

  fn.copyProps(self, criteriaUtils, "label->criteriaLabel");
  fn.copyProps(self, fn, "formatDateTime");

  self.copyItems = function(vm, event) {
    let copyables = this.itemsObs().filter(tables.hasBeenChecked);
    let confirmMsg = copyables.length > 1 ? "App configs have been copied." : "App config has been copied.";

    utils.startHandler(vm, event);
    Promise.mapSeries(copyables, function(appConfig) {
      let copy = JSON.parse(JSON.stringify(appConfig));
      delete copy.createdOn;
      delete copy.modifiedOn;
      delete copy.guid;
      delete copy.version;
      copy.criteria = copy.criteria || {};
      copy.criteria.minAppVersions = copy.criteria.minAppVersions || {};
      copy.criteria.minAppVersions["iPhone OS"] = 1000;
      copy.criteria.minAppVersions.Android = 1000;
      copy.label += " (Copy)";
      return serverService.createAppConfig(copy);
    })
      .then(load.bind(self))
      .then(utils.successHandler(vm, event, confirmMsg))
      .catch(utils.failureHandler({ transient: false, id: 'appconfigs' }));
  };

  function load() {
    serverService.getAppConfigs(self.showDeletedObs())
      .then(response => {
        let promises = response.items.map(formatReferencedModels);
        return Promise.all(promises).then(() => Promise.resolve(response));
      })
      .then(fn.log("response"))
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({ id: 'appconfigs' }));
  }
  load();
};
