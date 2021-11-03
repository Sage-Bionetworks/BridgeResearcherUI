import alerts from "../../widgets/alerts";
import BaseAssessment from "./base_assessment.js";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default class GeneralAssessment extends BaseAssessment {
  constructor(params) {
    super(params, 'assessment');
    this.assessment = this.newAssessment();

    this.osNameOpts = [
      {label: "Android", value: "Android"},
      {label: "iOS", value: "iPhone OS"},
      {label: "Both (Universal)", value: "Universal"}
    ];

    this.binder
      .bind("title")
      .bind("version")
      .bind("identifier")
      .bind("summary")
      .bind("revision")
      .bind("ownerId")
      .bind("orgOptions[]")
      .bind("osName")
      .bind("validationStatus")
      .bind("normingStatus")
      .bind("tags[]")
      .obs("allTags[]")
      .obs("addTag");

    serverService.getTags()
      .then(res => this.addTags(res))
      .then(optionsService.getOrganizationOptions)
      .then(opts => this.orgOptionsObs.pushAll(opts))
      .then(() => this.load())
      .catch(this.failureHandler);
  }
  createHistoryLink() {
    return `/assessments/${this.guidObs()}/history`;
  }
  publish(vm, event) {
    alerts.prompt("Do you want to define a new identifier for this assessment "+
      "when it is published as a shared assessment?", (newIdentifier) => {
      utils.startHandler(vm, event);
      serverService.publishAssessment(this.guid, newIdentifier)
        .then(() => this.load())
        .then(utils.successHandler(vm, event, "Assessment has been published as a shared assessment."))
        .catch(this.failureHandler);
    }, this.identifierObs());
  }
  formatOrgId(orgId) {
    const orgs = this.orgOptionsObs();
    if (orgId && orgs.some(opt => opt.value === orgId)) {
      return orgs.filter(opt => opt.value === orgId)[0].label;
    }
    return orgId;
  }
  addTag() {
    let tag = this.addTagObs();
    if (tag && tag.trim()) {
      this.tagsObs.push(tag.trim());
    }
  }
  addTags(response) {
    let array = [];
    Object.keys(response).forEach(ns => {
      let nsString = (ns === 'default') ? '' : (ns+":");
      response[ns].forEach(value => {
        array.push(nsString + value);
      });
    });
    this.allTagsObs.pushAll(array);
  }
}