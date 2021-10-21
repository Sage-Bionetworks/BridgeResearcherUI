import "../css/main.scss";
import "../lib/toastr.min.css";
import "../lib/dragula.min.css";
import "../lib/jquery.scrollTo";
import "./bindings";
import "./bindings/dragula";
import "./bindings/semantic";
import "./components";
import { Router } from "director/build/director";
import ko from "knockout";
import "knockout-postbox";
import root from "./root";

const $ACCORDIAN = $("#nav-accordian");
const GUID = ["guid"];
const GUID_CREATEDON = ["guid", "createdOn"];
const ID = ["id"];
const ID_GUID = ["id", "guid"];
const ID_REVISION = ["id", "revision"];
const ORGID = ["orgId"];
const ORGID_USERID = ["orgId", "userId"];
const SCHEMAID = ["schemaId"];
const SCHEMAID_REVISION = ["schemaId", "revision"];
const STUDYID = ["studyId"];
const STUDYID_USERID = ["studyId", "userId"];
const STUDYID_USERID_GUID = ["studyId", "userId", "guid"];
const STUDYID_USERID_IDENTIFIER = ["studyId", "userId", "identifier"];
const STUDYID_USERID_EVENTID = ["studyId", "userId", "eventId"];
const TYPE = ["templateType"];
const TYPE_GUID = ["templateType", "guid"];
const TYPE_GUID_CREATEDON = ["templateType", "guid", "createdOn"];
const USERID = ["userId"];
const USERID_GUID = ["userId", "guid"];
const USERID_IDENTIFIER = ["userId", "identifier"];
const USERID_REFERENT_GUID = ["userId", "referentType", "guid"];
const USERID_STUDYID = ["userId", "studyId"];

function namedParams(fields, args) {
  return (fields || []).reduce(function(params, name, i) {
    params[name] = decodeURIComponent(args[i]);
    return params;
  }, {});
}

function routeTo(routeName, section, fields) {
  return function() {
    $ACCORDIAN
      .attr("class", "ui styled fluid accordion " + section)
      .find("*[data-ref='" + section + "']")
      .closest(".content")
      .addClass("active")
      .prev()
      .addClass("active");
    let params = namedParams(fields, arguments);
    root.changeView(routeName, params);
  };
}
const FORMAT_PARSER = /\{[^\|}]+\}/g;

function redirectTo(newRoute) {
  return function(...args) {
    var route = newRoute.replace(FORMAT_PARSER, function(token) {
      var prop = token.substring(1, token.length - 1);
      return args[prop];
    });
    router.setRoute(route);
  };
}

const router = new Router();
router.param("guid", /([^\/]*)/);
router.param("createdOn", /([^\/]*)/);
router.on("/settings", redirectTo("/settings/general"));
router.on("/settings/general", routeTo("general", "settings"));
router.on("/settings/email", routeTo("email", "settings"));
router.on("/settings/data_groups", routeTo("data_groups", "settings"));
router.on("/settings/password_policy", routeTo("password_policy", "settings"));
router.on("/settings/user_attributes", routeTo("user_attributes", "settings"));
router.on("/settings/oauth_providers", routeTo("oauth_providers", "settings"));
router.on("/settings/install_links", routeTo("install_links", "settings"));
router.on("/settings/advanced", routeTo("advanced", "settings"));
//DELETEME
router.on("/app_links", routeTo("app_links", "links"));
router.on("/export_settings", routeTo("export_settings", "export"));
router.on("/shared_upload_metadata", routeTo("shared_upload_metadata", "metadata"));
router.on("/task_identifiers", routeTo("task_identifiers", "taskIds"));
router.on("/subpopulations", routeTo("subpopulations", "subpops"));
router.on("/subpopulations/:guid", redirectTo("/subpopulations/{0}/general"));
router.on("/subpopulations/:guid/general", routeTo("subpopulation", "subpops", GUID));
router.on("/subpopulations/:guid/editor", redirectTo("/subpopulations/{0}/editor/recent"));
router.on("/subpopulations/:guid/editor/recent", routeTo("subpopulation_editor", "subpops", GUID));
router.on("/subpopulations/:guid/editor/:createdOn", routeTo("subpopulation_editor", "subpops", GUID_CREATEDON));
router.on("/subpopulations/:guid/editor/recent/history", routeTo("subpopulation_history", "subpops", GUID));
router.on("/subpopulations/:guid/editor/:createdOn/history", routeTo("subpopulation_history", "subpops", GUID_CREATEDON));
router.on("/subpopulations/:guid/download", routeTo("subpopulation_download", "subpops", GUID));
router.on("/configs", routeTo("configs", "configs"));
router.on("/configs/new", redirectTo("/configs/new/revisions/1/editor"));
router.on("/configs/:id/revisions/:revision", redirectTo("/configs/{0}/revisions/{1}/editor"));
router.on("/configs/:id/revisions/:revision/editor", routeTo("config_editor", "configs", ID_REVISION));
router.on("/configs/:id/revisions/:revision/history", routeTo("config_history", "configs", ID_REVISION));
router.on("/reports", redirectTo("/reports/uploads"));
router.on("/reports/uploads", routeTo("dailyUploads", "reports"));
router.on("/reports/signUps", routeTo("signUps", "reports"));
router.on("/reports/retention", routeTo("retention", "reports"));
router.on("/reports/raw/:identifier", routeTo("report", "reports", ID));
router.on("/reports/raw", routeTo("reports", "reports"));
router.on("/surveys", routeTo("surveys", "surveys"));
router.on("/surveys/:guid/:createdOn/versions", routeTo("survey_versions", "surveys", GUID_CREATEDON));
router.on("/surveys/:guid/:createdOn/schema", routeTo("survey_schema", "surveys", GUID_CREATEDON));
router.on("/surveys/:guid/:createdOn/editor", routeTo("survey", "surveys", GUID_CREATEDON));
router.on("/surveys/:guid", routeTo("survey", "surveys", GUID));
router.on("/schemas", routeTo("schemas", "schemas"));
router.on("/schemas/:schemaId/versions/:revision/editor", routeTo("schema", "schemas", SCHEMAID_REVISION));
router.on("/schemas/:schemaId/versions/:revision/history", routeTo("schema_versions", "schemas", SCHEMAID_REVISION));
router.on("/schemas/:schemaId", routeTo("schema", "schemas", SCHEMAID));
router.on("/scheduleplans", routeTo("scheduleplans", "scheduling"));
router.on("/scheduleplans/:guid", routeTo("scheduleplan", "scheduling", GUID));
router.on("/participants/:userId/reports/:identifier", routeTo("participant_report", "participants", USERID_IDENTIFIER));
router.on("/participants/:userId/activities/events", routeTo("participant_activity_events", "participants", USERID));
router.on("/participants/:userId/activities/:referentType/:guid", routeTo("participant_activity", "participants", USERID_REFERENT_GUID));
router.on("/participants/:userId/activities", routeTo("participant_activities", "participants", USERID));
router.on("/participants/:userId/enrollments", routeTo("participant_enrollments", "participants", USERID));
router.on("/participants/:userId/enrollments/consents/:studyId", routeTo("participant_consents", "participants", USERID_STUDYID));
router.on("/participants/:userId/notifications", routeTo("participant_notifications", "participants", USERID));
router.on("/participants/:userId/reports", routeTo("participant_reports", "participants", USERID));
router.on("/participants/:userId/uploads", routeTo("participant_uploads", "participants", USERID));
router.on("/participants/:userId/uploads/:guid", routeTo("participant_upload", "participants", USERID_GUID));
router.on("/participants/:userId/clientData", routeTo("participant_clientData", "participants", USERID));
router.on("/participants/:userId/general", routeTo("participant_general", "participants", USERID));
router.on("/participants/:userId/requestInfo", routeTo("participant_request_info", "participants", USERID));
router.on("/participants/:userId", routeTo("participant_general", "participants", USERID));
router.on("/participants", routeTo("participants", "participants"));
router.on("/events", redirectTo("/events/custom_events"));
router.on("/events/custom_events", routeTo("custom_events", "events"));
router.on("/events/auto_custom_events", routeTo("auto_custom_events", "events"));
router.on("/topics/:guid", routeTo("topic", "notifications", GUID));
router.on("/topics", routeTo("topics", "notifications"));
router.on("/files/:guid", routeTo("file", "files", GUID));
router.on("/files", routeTo("files", "files"));
router.on("/admin/cache", routeTo("admin_cache", "cache"));
router.on("/admin/apps", routeTo("admin_apps", "apps"));
  router.on("/admin/apps/:id", routeTo("admin_app", "apps", ID));
router.on("/admin/uploads", routeTo("uploads", "uploads"));
router.on("/admin/uploads/:guid", routeTo("upload", "uploads", GUID));
// router.on("/admin/masterschedules", routeTo("masterschedules"));
router.on("/organizations", routeTo("organizations", "organizations"));
router.on("/organizations/:orgId", redirectTo("/organizations/{0}/general"));
router.on("/organizations/:orgId/general", routeTo("orgEditor", "organizations", ORGID));
router.on("/organizations/:orgId/studies", routeTo("orgStudies", "organizations", ORGID));
router.on("/organizations/:orgId/members", routeTo("orgMembers", "organizations", ORGID));
router.on("/organizations/:orgId/members/:userId", redirectTo("/organizations/{0}/members/{1}/general"));
router.on("/organizations/:orgId/members/:userId/general", 
  routeTo("memGeneral", "organizations", ORGID_USERID));
router.on("/organizations/:orgId/members/:userId/clientData", 
  routeTo("memClientData", "organizations", ORGID_USERID));
router.on("/organizations/:orgId/members/:userId/requestInfo", 
  routeTo("memRequestInfo", "organizations", ORGID_USERID));
router.on("/studies", routeTo("studies", "studies"));

router.on("/studies/:studyId", redirectTo("/studies/{0}/general"));
router.on("/studies/:studyId/general", routeTo("studyEditor", "studies", STUDYID));
router.on("/studies/:studyId/ui", routeTo("studyUi", "studies", STUDYID));
router.on("/studies/:studyId/sponsors", routeTo("studySponsors", "studies", STUDYID));
router.on("/studies/:studyId/events", routeTo("studyEvents", "studies", STUDYID));
router.on("/studies/:studyId/schedule", routeTo("studySchedule", "studies", STUDYID));
router.on("/studies/:studyId/enrollments", routeTo("studyEnrollments", "studies", STUDYID));
router.on("/studies/:studyId/externalids", routeTo("externalIds", "studies", STUDYID));
router.on("/studies/:studyId/clientdata", routeTo("studyClientData", "studies", STUDYID));

router.on("/studies/:studyId/participants", routeTo("studyParticipants", "studies", STUDYID));
router.on("/studies/:studyId/participants/:userId", redirectTo("/studies/{0}/participants/{1}/general"));
router.on("/studies/:studyId/participants/:userId/general", 
  routeTo("studyparticipant_general", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/enrollments", 
  routeTo("studyparticipant_enrollments", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/schedule", 
  routeTo("studyparticipant_schedule", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/schedule/timeline", 
  routeTo("studyparticipant_timeline", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/schedule/history/:eventId", 
  routeTo("studyparticipant_history", "studies", STUDYID_USERID_EVENTID));
router.on("/studies/:studyId/participants/:userId/uploads", 
  routeTo("studyparticipant_uploads", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/uploads/:guid", 
  routeTo("studyparticipant_upload", "studies", STUDYID_USERID_GUID));
router.on("/studies/:studyId/participants/:userId/notifications", 
  routeTo("studyparticipant_notifications", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/reports", 
  routeTo("studyparticipant_reports", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/reports/:identifier", 
  routeTo("studyparticipant_report", "studies", STUDYID_USERID_IDENTIFIER));
router.on("/studies/:studyId/participants/:userId/clientData", 
  routeTo("studyparticipant_clientData", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/requestInfo", 
  routeTo("studyparticipant_request_info", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/enrollments/consents", 
  routeTo("studyparticipant_consents", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/schedule/adherence", 
  routeTo("studyparticipant_adherence", "studies", STUDYID_USERID));
router.on("/studies/:studyId/participants/:userId/schedule/adherencesearch", 
  routeTo("studyparticipant_adherencesearch", "studies", STUDYID_USERID));

router.on("/schedules", routeTo("schedules2", "schedules"));
router.on("/schedules/:guid", routeTo("schedule2", "schedules", GUID));

router.on("/assessments", routeTo("assessments", "assessments"));
router.on("/assessments/:guid", redirectTo("/assessments/{0}/general"));
router.on("/assessments/:guid/general", routeTo("assessment_general", "assessments", GUID));
router.on("/assessments/:guid/ui", routeTo("assessment_ui", "assessments", GUID));
router.on("/assessments/:guid/config", routeTo("assessment_config", "assessments", GUID));
router.on("/assessments/:guid/history", routeTo("assessment_history", "assessments", GUID));
router.on("/assessments/:guid/resources", routeTo("assessment_resources", "assessments", GUID));
router.on("/assessments/:guid/template", routeTo("assessment_template", "assessments", GUID));
router.on("/assessments/:guid/customize", routeTo("assessment_customize", "assessments", GUID));
router.on("/assessments/:id/resources/:guid", routeTo("assessment_resource", "assessments", ID_GUID));

router.on("/sharedassessments", routeTo("sharedassessments", "sharedassessments"));

router.on("/sharedassessments/:guid", redirectTo("/sharedassessments/{0}/general"));
router.on("/sharedassessments/:guid/general", 
  routeTo("sharedassessment_general", "sharedassessments", GUID));
router.on("/sharedassessments/:guid/ui", 
  routeTo("sharedassessment_ui", "sharedassessments", GUID));
router.on("/sharedassessments/:guid/history", 
  routeTo("sharedassessment_history", "sharedassessments", GUID));
router.on("/sharedassessments/:guid/config", 
  routeTo("sharedassessment_config", "sharedassessments", GUID));
router.on("/sharedassessments/:guid/resources", 
  routeTo("sharedassessment_resources", "sharedassessments", GUID));
router.on("/sharedassessments/:id/resources/:guid", 
  routeTo("sharedassessment_resource", "sharedassessments", ID_GUID));

router.on("/admin/tags", routeTo("tags", "tags"));

router.on("/app_configs", routeTo("appconfigs", "appConfigs"));
router.on("/app_configs/:guid", routeTo("appconfig", "appConfigs", GUID));
router.on("/templates/:templateType/:guid/general", routeTo("template_general", "templates", TYPE_GUID));
router.on("/templates/:templateType/:guid/editor", routeTo("template_editor", "templates", TYPE_GUID));
router.on("/templates/:templateType/:guid/editor/:createdOn", routeTo("template_editor", "templates", TYPE_GUID_CREATEDON));
router.on("/templates/:templateType/:guid/editor/:createdOn/history", routeTo("template_history", "templates", TYPE_GUID_CREATEDON));
router.on("/templates/:templateType/:guid", redirectTo("/templates/{0}/{1}/editor"));
router.on("/templates/:templateType", routeTo("templates", "templates", TYPE));
router.on("/templates", routeTo("templatesList", "templates"));

router.configure({
  html5history: true,
  notfound: routeTo("not_found"),
  on: [
    ko.postbox.reset,
    function() {
      root.sidePanelObs("navigation");
    }
  ]
});
router.init(document.location.pathname + document.location.search);

document.body.addEventListener('click', (event) => {
  if (event.target.href) {
    event.preventDefault();
    router.setRoute(event.target.getAttribute('href'));
  }
}, true); // true = on the way down from top of tree?