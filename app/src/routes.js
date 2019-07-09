import "../css/main.scss";
import "../lib/toastr.min.css";
import "../lib/dragula.min.css";

import "../lib/jquery.scrollTo";
import "./bindings";
import "./bindings/dragula";
import "./bindings/semantic";
import "./components";
import "knockout-postbox";
import { Router } from "director/build/director";
import ko from "knockout";
import root from "./root";

const GUID_CREATEDON = ["guid", "createdOn"];
const GUID = ["guid"];
const ID = ["id"];
const ID_REVISION = ["id", "revision"];
const ID_VERSION = ["id", "version"];
const SCHEMAID = ["schemaId"];
const SCHEMAID_REVISION = ["schemaId", "revision"];
const TASKID = ["taskId"];
const TYPE = ["templateType"];
const TYPE_GUID = ["templateType", "guid"];
const TYPE_GUID_CREATEDON = ["templateType", "guid", "createdOn"];
const USERID = ["userId"];
const USERID_IDENTIFIER = ["userId", "identifier"];
const USERID_GUID = ["userId", "guid"];
const USERID_REFERENT_GUID = ["userId", "referentType", "guid"];
const $ACCORDIAN = $("#nav-accordian");

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
router.on("/participants/:userId/consents", routeTo("participant_consents", "participants", USERID));
router.on("/participants/:userId/notifications", routeTo("participant_notifications", "participants", USERID));
router.on("/participants/:userId/reports", routeTo("participant_reports", "participants", USERID));
router.on("/participants/:userId/uploads", routeTo("participant_uploads", "participants", USERID));
router.on("/participants/:userId/uploads/:guid", routeTo("participant_upload", "participants", USERID_GUID));
router.on("/participants/:userId/clientData", routeTo("participant_clientData", "participants", USERID));
router.on("/participants/:userId/general", routeTo("participant_general", "participants", USERID));
router.on("/participants/:userId/requestInfo", routeTo("participant_request_info", "participants", USERID));
router.on("/participants/:userId", routeTo("participant_general", "participants", USERID));
router.on("/participants", routeTo("participants", "participants"));
router.on("/external_ids", routeTo("external_ids", "extids"));
router.on("/events", redirectTo("/events/event_keys"));
router.on("/events/event_keys", routeTo("event_keys", "events"));
router.on("/events/auto_custom_events", routeTo("auto_custom_events", "events"));
router.on("/tasks/:taskId", routeTo("task", "tasks", TASKID));
router.on("/tasks", routeTo("tasks", "tasks"));
router.on("/topics/:guid", routeTo("topic", "notifications", GUID));
router.on("/topics", routeTo("topics", "notifications"));
router.on("/admin/info", routeTo("admin_info", "info"));
router.on("/admin/cache", routeTo("admin_cache", "cache"));
router.on("/admin/studies", routeTo("admin_studies", "studies"));
router.on("/admin/studies/:id", routeTo("admin_study", "studies", ID));
router.on("/admin/substudies", routeTo("admin_substudies", "substudies"));
router.on("/admin/substudies/:id", routeTo("admin_substudy", "substudies", ID));
router.on("/admin/uploads", routeTo("uploads", "uploads"));
router.on("/admin/uploads/:guid", routeTo("upload", "uploads", GUID));
router.on("/shared_modules", routeTo("shared_modules", "modules"));
router.on("/shared_modules/:id", routeTo("shared_module", "modules", ID)); // unused now?
router.on("/shared_modules/:id/versions/:version/editor", routeTo("shared_module", "modules", ID_VERSION));
router.on("/shared_modules/:id/versions/:version/history", routeTo("shared_module_versions", "modules", ID_VERSION));
router.on("/app_configs", routeTo("appconfigs", "appConfigs"));
router.on("/app_configs/:guid", routeTo("appconfig", "appConfigs", GUID));
router.on("/templates/:templateType/:guid/general", routeTo("template_general", "templates", TYPE_GUID));
router.on("/templates/:templateType/:guid/editor", routeTo("template_editor", "templates", TYPE_GUID));
router.on("/templates/:templateType/:guid/editor/:createdOn", routeTo("template_editor", "templates", TYPE_GUID_CREATEDON));
router.on("/templates/:templateType/:guid/editor/:createdOn/history", routeTo("template_history", "templates", TYPE_GUID_CREATEDON));
router.on("/templates/:templateType/:guid", redirectTo("/templates/{0}/{1}/general"));
router.on("/templates/:templateType", routeTo("templates", "templates", TYPE));
router.on("/templates", routeTo("templatesList", "templates"));

router.configure({
  notfound: routeTo("not_found"),
  on: [
    ko.postbox.reset,
    function() {
      root.sidePanelObs("navigation");
    }
  ]
});
router.init("/reports/uploads");
