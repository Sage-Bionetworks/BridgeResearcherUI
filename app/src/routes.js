import '../css/main';
import '../lib/toastr.min';
import '../lib/dragula.min';

import '../lib/jquery.scrollTo';
import './bindings';
import './bindings/dragula';
import './bindings/semantic';
import './components';
import 'knockout-postbox';
import {Router} from 'director/build/director';
import {serverService} from './services/server_service';
import ko from 'knockout';
import root from './root';

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
const $ACCORDIAN = $('#nav-accordian');

function namedParams(fields, args) {
    return (fields || []).reduce(function(params, name, i) {
        params[name] = decodeURIComponent(args[i]); 
        return params;
    }, {});
}

function routeTo(routeName, section, fields) {
    return function() {
        $ACCORDIAN
            .attr('class', 'ui styled fluid accordion ' + section)
            .find("*[data-ref='"+section+"']")
            .closest(".content")
            .addClass("active")
            .prev()
            .addClass("active");
        var params = namedParams(fields, arguments);
        root.changeView(routeName, params);
    };
}
function redirectTo(newRoute) {
    return function() {
        router.setRoute(newRoute);
    };
}

var router = new Router();
router.param('guid', /([^\/]*)/);
router.param('createdOn', /([^\/]*)/);
router.on('/settings', redirectTo('/settings/general'));
router.on('/settings/general', routeTo('general', 'settings'));
router.on('/settings/email', routeTo('email', 'settings'));
router.on('/settings/data_groups', routeTo('data_groups', 'settings'));
router.on('/settings/password_policy', routeTo('password_policy', 'settings'));
router.on('/settings/event_keys', routeTo('event_keys', 'settings'));
router.on('/settings/user_attributes', routeTo('user_attributes', 'settings'));
router.on('/settings/oauth_providers', routeTo('oauth_providers', 'settings'));
router.on('/settings/install_links', routeTo('install_links', 'settings'));
router.on('/app_links', routeTo('app_links', 'links'));
router.on('/export_settings', routeTo('export_settings', 'export'));
router.on('/shared_upload_metadata', routeTo('shared_upload_metadata', 'metadata'));
router.on('/task_identifiers', routeTo('task_identifiers', 'taskIds'));

router.on('/email_templates', redirectTo('/email_templates/verify_email'));
router.on('/email_templates/reset_password', routeTo('reset_password', 'templates'));
router.on('/email_templates/verify_email', routeTo('verify_email', 'templates'));
router.on('/email_templates/account_exists', routeTo('account_exists', 'templates'));
router.on('/email_templates/email_signin', routeTo('email_signin', 'templates'));

router.on('/sms_templates', redirectTo('/sms_templates/verify_phone', 'sms'));
router.on('/sms_templates/reset_password', routeTo('sms_reset_password', 'sms'));
router.on('/sms_templates/verify_phone', routeTo('sms_verify_phone', 'sms'));
router.on('/sms_templates/account_exists', routeTo('sms_account_exists', 'sms'));
router.on('/sms_templates/phone_signin', routeTo('sms_phone_signin', 'sms'));
router.on('/sms_templates/app_install_link', routeTo('sms_app_install_link', 'sms'));

router.on('/subpopulations/:guid/consents/history', routeTo('subpopulation_history', 'subpops', GUID));
router.on('/subpopulations/:guid/consents/download', routeTo('subpopulation_download', 'subpops', GUID));
router.on('/subpopulations/:guid/consents/:createdOn', routeTo('subpopulation_editor', 'subpops', GUID_CREATEDON));
router.on('/subpopulations/:guid', routeTo('subpopulation', 'subpops', GUID));
router.on('/subpopulations', routeTo('subpopulations', 'subpops'));
router.on('/reports', redirectTo('/reports/uploads'));
router.on('/reports/uploads', routeTo('dailyUploads', 'reports'));
router.on('/reports/signUps', routeTo('signUps', 'reports'));
router.on('/reports/raw/:identifier', routeTo('report', 'reports', ID));
router.on('/reports/raw', routeTo('reports', 'reports'));
router.on('/surveys', routeTo('surveys', 'surveys'));
router.on('/surveys/:guid/:createdOn/versions', routeTo('survey_versions', 'surveys', GUID_CREATEDON));
router.on('/surveys/:guid/:createdOn/schema', routeTo('survey_schema', 'surveys', GUID_CREATEDON));
router.on('/surveys/:guid/:createdOn/editor', routeTo('survey', 'surveys', GUID_CREATEDON));
router.on('/surveys/:guid', routeTo('survey', 'surveys', GUID));
router.on('/schemas', routeTo('schemas', 'schemas'));
router.on('/schemas/:schemaId/versions/:revision/editor', routeTo('schema', 'schemas', SCHEMAID_REVISION));
router.on('/schemas/:schemaId/versions/:revision/history', routeTo('schema_versions', 'schemas', SCHEMAID_REVISION));
router.on('/schemas/:schemaId', routeTo('schema', 'schemas', SCHEMAID));
router.on('/scheduleplans', routeTo('scheduleplans', 'scheduling'));
router.on('/scheduleplans/:guid', routeTo('scheduleplan', 'scheduling', GUID));
router.on('/participants/:userId/reports/:identifier', routeTo('participant_report', 'participants', USERID_IDENTIFIER));
router.on('/participants/:userId/activities/:guid', routeTo('participant_activity', 'participants', USERID_GUID));
router.on('/participants/:userId/activities', routeTo('participant_activities', 'participants', USERID));
router.on('/participants/:userId/newActivities/:referentType/:guid', routeTo('participant_newActivity', 'participants', USERID_REFERENT_GUID));
router.on('/participants/:userId/newActivities', routeTo('participant_newActivities', 'participants', USERID));
router.on('/participants/:userId/consents', routeTo('participant_consents', 'participants', USERID));
router.on('/participants/:userId/notifications', routeTo('participant_notifications', 'participants', USERID));
router.on('/participants/:userId/reports', routeTo('participant_reports', 'participants', USERID));
router.on('/participants/:userId/uploads', routeTo('participant_uploads', 'participants', USERID));
router.on('/participants/:userId/clientData', routeTo('participant_clientData', 'participants', USERID));
router.on('/participants/:userId', routeTo('participant_general', 'participants', USERID));
router.on('/participants/:userId/general', routeTo('participant_general', 'participants', USERID));
router.on('/participants/:userId/requestInfo', routeTo('participant_request_info', 'participants', USERID));
router.on('/participants', routeTo('participants', 'participants'));
router.on('/external_ids', routeTo('external_ids', 'extids'));
router.on('/tasks', routeTo('tasks', 'tasks'));
router.on('/tasks/:taskId', routeTo('task', 'tasks', TASKID));
router.on('/topics/:guid', routeTo('topic', 'notifications', GUID));
router.on('/topics', routeTo('topics', 'notifications'));
router.on('/admin/info', routeTo('admin_info', 'info'));
router.on('/admin/cache', routeTo('admin_cache', 'cache'));
router.on('/shared_modules', routeTo('shared_modules', 'modules'));
router.on('/shared_modules/:id', routeTo('shared_module', 'modules', ID));
router.on('/shared_modules/:id/versions/:version/editor', 'modules', routeTo('shared_module', ID_VERSION));
router.on('/shared_modules/:id/versions/:version/history', 'modules', routeTo('shared_module_versions', ID_VERSION));
router.on('/app_configs', routeTo('appconfigs', 'appConfigs'));
router.on('/app_configs/:guid', routeTo('appconfig', 'appConfigs', GUID));

router.configure({
    notfound: routeTo('not_found'),
    'on': [ko.postbox.reset, function() {
        root.sidePanelObs('navigation'); 
    }]
});
router.init('/reports/uploads');
