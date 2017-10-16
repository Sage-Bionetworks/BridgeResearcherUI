import '../css/main';
import '../lib/toastr.min';
import '../lib/dragula.min';

import { Router } from 'director/build/director';
import ko from 'knockout';
import root from './root';
import serverService from './services/server_service';
import './bindings';
import './bindings/semantic';
import '../lib/jquery.scrollTo';
import './bindings/dragula';
import './components';
import 'knockout-postbox';

const GUID_CREATEDON = ['guid','createdOn'];
const GUID = ['guid'];
const ID = ['id'];
const ID_VERSION = ['id','version'];
const SCHEMAID = ['schemaId'];
const SCHEMAID_REVISION = ['schemaId','revision'];
const TASKID = ['taskId'];
const USERID = ['userId'];
const USERID_IDENTIFIER = ['userId','identifier'];
const USERID_GUID = ['userId','guid'];
const USERID_REFERENT_GUID = ['userId','referentType','guid'];

function namedParams(fields, args) {
    return (fields || []).reduce(function(params, name, i) {
        params[name] = decodeURIComponent(args[i]); 
        return params;
    }, {});
}
function routeTo(routeName, fields) {
    return function() {
        var params = namedParams(fields, arguments);
        root.changeView(routeName, params);
    };
}
function redirectTo(response) {
    router.setRoute('/enrollees/' + response.items[0].id+'/general');
}
function redirectToParticipant(externalId) {
    serverService.getParticipants(null,5,"+"+externalId+"@").then(redirectTo);
}

var router = new Router();
router.param('guid', /([^\/]*)/);
router.param('createdOn', /([^\/]*)/);
router.on('/settings/general', routeTo('general'));
router.on('/settings/email', routeTo('email'));
router.on('/settings/data_groups', routeTo('data_groups'));
router.on('/settings/password_policy', routeTo('password_policy'));
router.on('/settings/event_keys', routeTo('event_keys'));
router.on('/settings/user_attributes', routeTo('user_attributes'));
router.on('/export_settings', routeTo('export_settings'));
router.on('/shared_upload_metadata', routeTo('shared_upload_metadata'));
router.on('/task_identifiers', routeTo('task_identifiers'));
router.on('/email_templates', routeTo('verify_email'));
router.on('/email_templates/verify_email', routeTo('verify_email'));
router.on('/email_templates/reset_password', routeTo('reset_password'));
router.on('/email_templates/email_signin', routeTo('email_signin'));
router.on('/email_templates/account_exists', routeTo('account_exists'));
router.on('/external_ids', routeTo('external_ids'));
router.on('/subpopulations/:guid/consents/history', routeTo('subpopulation_history', GUID));
router.on('/subpopulations/:guid/consents/download', routeTo('subpopulation_download', GUID));
router.on('/subpopulations/:guid/consents/:createdOn', routeTo('subpopulation_editor', GUID_CREATEDON));
router.on('/subpopulations/:guid', routeTo('subpopulation', GUID));
router.on('/subpopulations', routeTo('subpopulations'));
router.on('/reports', routeTo('dailyUploads'));
router.on('/reports/uploads', routeTo('dailyUploads'));
router.on('/reports/signUps', routeTo('signUps'));
router.on('/reports/raw/:identifier', routeTo('report', ID));
router.on('/reports/raw', routeTo('reports'));
router.on('/surveys', routeTo('surveys'));
router.on('/surveys/:guid/:createdOn/versions', routeTo('survey_versions', GUID_CREATEDON));
router.on('/surveys/:guid/:createdOn/schema', routeTo('survey_schema', GUID_CREATEDON));
router.on('/surveys/:guid/:createdOn/editor', routeTo('survey', GUID_CREATEDON));
router.on('/surveys/:guid', routeTo('survey', GUID));
router.on('/schemas', routeTo('schemas'));
router.on('/schemas/:schemaId/versions/:revision/editor', routeTo('schema', SCHEMAID_REVISION));
router.on('/schemas/:schemaId/versions/:revision/history', routeTo('schema_versions', SCHEMAID_REVISION));
router.on('/schemas/:schemaId', routeTo('schema', SCHEMAID));
router.on('/schedules', routeTo('schedules'));
router.on('/scheduleplans', routeTo('scheduleplans'));
router.on('/scheduleplans/:guid', routeTo('scheduleplan', GUID));
router.on('/participants/:userId/reports/:identifier', routeTo('participant_report', USERID_IDENTIFIER));
router.on('/participants/:userId/activities/:guid', routeTo('participant_activity', USERID_GUID));
router.on('/participants/:userId/activities', routeTo('participant_activities', USERID));
router.on('/participants/:userId/newActivities/:referentType/:guid', routeTo('participant_newActivity', USERID_REFERENT_GUID));
router.on('/participants/:userId/newActivities', routeTo('participant_newActivities', USERID));
router.on('/participants/:userId/consents', routeTo('participant_consents', USERID));
router.on('/participants/:userId/notifications', routeTo('participant_notifications', USERID));
router.on('/participants/:userId/reports', routeTo('participant_reports', USERID));
router.on('/participants/:userId/uploads', routeTo('participant_uploads', USERID));
router.on('/participants/:userId/clientData', routeTo('participant_clientData', USERID));
router.on('/participants/:userId', routeTo('participant_general', USERID));
router.on('/participants/:userId/general', routeTo('participant_general', USERID));
router.on('/participants/:userId/requestInfo', routeTo('participant_request_info', USERID));
router.on('/participants', routeTo('participants'));
// EVERYTHING IN PARTICIPANTS, HAS TO BE IN ENROLLEES
router.on('/enrollees/:userId/reports/:identifier', routeTo('participant_report', USERID_IDENTIFIER));
router.on('/enrollees/:userId/activities/:guid', routeTo('participant_activity', USERID_GUID));
router.on('/enrollees/:userId/activities', routeTo('participant_activities', USERID));
router.on('/enrollees/:userId/newActivities/:referentType/:guid', routeTo('participant_newActivity', USERID_REFERENT_GUID));
router.on('/enrollees/:userId/newActivities', routeTo('participant_newActivities', USERID));
router.on('/enrollees/:userId/consents', routeTo('participant_consents', USERID));
router.on('/enrollees/:userId/notifications', routeTo('participant_notifications', USERID));
router.on('/enrollees/:userId/reports', routeTo('participant_reports', USERID));
router.on('/enrollees/:userId/uploads', routeTo('participant_uploads', USERID));
router.on('/enrollees/:userId/clientData', routeTo('participant_clientData', USERID));
router.on('/enrollees/:userId/general', routeTo('participant_general', USERID));
router.on('/enrollees/:userId/requestInfo', routeTo('participant_request_info', USERID));
router.on('/enrollees/:externalId', redirectToParticipant);
router.on('/enrollees', routeTo('enrollees'));

router.on('/tasks', routeTo('tasks'));
router.on('/tasks/:taskId', routeTo('task', TASKID));
router.on('/topics/:guid', routeTo('topic', GUID));
router.on('/topics', routeTo('topics'));
router.on('/admin/info', routeTo('admin_info'));
router.on('/admin/cache', routeTo('admin_cache'));
router.on('/shared_modules', routeTo('shared_modules'));
router.on('/shared_modules/:id', routeTo('shared_module', ID));
router.on('/shared_modules/:id/versions/:version/editor', routeTo('shared_module', ID_VERSION));
router.on('/shared_modules/:id/versions/:version/history', routeTo('shared_module_versions', ID_VERSION));
router.on('/app_configs', routeTo('appconfigs'));
router.on('/app_configs/:guid', routeTo('appconfig', GUID));

router.configure({
    notfound: routeTo('not_found'),
    'on': [ko.postbox.reset, function() {
        root.sidePanelObs('navigation'); 
    }]
});
router.init();
