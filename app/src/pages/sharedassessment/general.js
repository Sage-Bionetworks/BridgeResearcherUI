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

export default function(params) {
  let self = this;

  fn.copyProps(self, fn, "formatDateTime");

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
    .bind("tags[]")
    .obs("allTags[]")
    .obs("addTag");
  fn.copyProps(self, fn, "formatDateTime");

  self.createHistoryLink = ko.computed(function() {
    return "#/sharedassessments/" + self.guidObs() + "/history";
  });

  function load() {
    return serverService.getSharedAssessment(params.guid)
      .then(binder.assign("sharedassessment"))
      .then(binder.update())
      .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
      .then(fn.handleObsUpdate(self.pageRevObs, "revision"));
  }

  self.doImport = function(vm, event) {
    alerts.prompt("Do you want to define a new identifier for this assessment "+
      "when it is imported into your app?", function(newIdentifier) {
      utils.startHandler(vm, event);
      serverService.importSharedAssessment(params.guid, newIdentifier)
        .then(load)
        .then(utils.successHandler(vm, event, "Assessment has been published as a shared assessment."))
        .catch(failureHandler);
    }, self.identifierObs());
  }

  self.orgMap = null;

  function setOrgOptions(orgMap) {
    self.orgMap = orgMap;
    let opts = Object.keys(orgMap).map((key) => ({label: orgMap[key], value: key}));
    self.orgOptionsObs.pushAll(opts);
  }

  self.formatOrgId = function(orgId) {
    return (orgId && self.orgMap[orgId]) ? self.orgMap[orgId] : orgId;
  }

  self.addTag = function() {
    let tag = self.addTagObs();
    if (tag.trim()) {
      self.tagsObs.push(tag.trim());
    }
  }

  function addTags(response) {
    let array = [];
    Object.keys(response).forEach(ns => {
      let nsString = (ns === 'default') ? '' : (ns+":");
      response[ns].forEach(value => {
        array.push(nsString + value);
      });
    });
    self.allTagsObs.pushAll(array);
  }

  serverService.getTags()
    .then(addTags)
    .then(() => optionsService.getOrganizationNames())
    .then(setOrgOptions)
    .then(load);
};
