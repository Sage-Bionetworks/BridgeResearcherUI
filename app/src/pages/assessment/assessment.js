import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Assessment not found.",
  redirectTo: "assessments",
  transient: false,
  id: 'assessment'
});

function newAssessment() {
  return {
    title: "New Assessment",
    identifier: "",
    summary: "",
    normingStatus: "",
    validationStatus: "",
    osName: "",
    tags: [],
    revision: 1,
    customizationFields: {}
  };
}

export default function(params) {
  let self = this;
  self.assessment = newAssessment();

  self.osNameOpts = [
    {label: "Android", value: "Android"},
    {label: "iOS", value: "iPhone OS"},
    {label: "Both (Universal)", value: "Universal"}
  ];

  let binder = new Binder(self)
    .obs("isNew", params.guid === "new")
    .obs("guid")
    .obs("createdOn")
    .obs("modifiedOn")
    .obs("pageTitle", "New Assessment")
    .obs("pageRev")
    .bind("title")
    .bind("version")
    .bind("identifier")
    .bind("summary")
    .bind("revision")
    .bind("ownerId")
    .bind("orgOptions[]")
    .bind("osName")
    .bind("originGuid")
    .bind("validationStatus")
    .bind("normingStatus")
    .bind("tags[]");
  fn.copyProps(self, fn, "formatDateTime");

  self.createHistoryLink = ko.computed(function() {
    return "#/assessments/" + self.guidObs() + "/history";
  });

  function saveAssessment(isNotNew) {
    if (isNotNew) {
      return serverService.updateAssessment(self.assessment);
    }
    return serverService.createAssessment(self.assessment);
  }
  function load() {
    if (params.guid === "new") {
      return Promise.resolve(newAssessment())
        .then(binder.assign("assessment"))
        .then(binder.update())
        .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
        .then(fn.handleObsUpdate(self.pageRevObs, "revision"));
        
    } else {
      return serverService.getAssessment(params.guid)
        .then(binder.assign("assessment"))
        .then(binder.update())
        .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
        .then(fn.handleObsUpdate(self.pageRevObs, "revision"));
    }
  }

  self.save = function(vm, event) {
    let isNotNew = (self.assessment.guid) && (self.revisionObs() === self.assessment.revision);

    self.assessment = binder.persist(self.assessment);

    utils.startHandler(vm, event);
    saveAssessment(isNotNew)
      .then(fn.handleStaticObsUpdate(self.isNewObs, false))
      .then(binder.assign("assessment"))
      .then(binder.update())
      .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
      .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
      .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
      .then(fn.handleCopyProps(params, "guid"))
      .then(fn.returning(self.assessment))
      .then(utils.successHandler(vm, event, "Assessment has been saved."))
      .catch(failureHandler);
  };

  function setOrgOptions(orgMap) {
    let opts = Object.keys(orgMap).map((key) => ({label: orgMap[key], value: key}));
    self.orgOptionsObs.pushAll(opts);
  }

  optionsService.getOrganizationNames()
    .then(setOrgOptions)
    .then(load);
};
