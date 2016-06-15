require('../css/main');
require('../lib/toastr.min');
require('../lib/dragula.min');

require('./bindings');
require('../lib/jquery.scrollTo');
require('./bindings/dragula');
require('./components');
var ko = require('knockout');
require('knockout-postbox');

var director = require('director');
var root = require('./root');

var GUID_CREATEDON = ['guid', 'createdOn'];
var GUID = ['guid'];
var ID = ['id'];
var SCHEMAID_REVISION = ['schemaId','revisions'];
var SCHEMAID = ['schemaId'];
var USERID_NAME = ['userId', 'name'];
var USERID_IDENTIFIER_NAME = ['userId','identifier','name'];
var USERID = ['userId'];

function namedParams(fields, args) {
    return (fields || []).reduce(function(params, name, i) {
        params[name] = decodeURIComponent(args[i]); 
        return params;
    }, {});
}
function routeTo(routeName, fields) {
    return function() {
        var params = namedParams(fields, arguments);
        console.log("routeTo", routeName, Object.keys(params).map(function(key) { return key + "=" + params[key];}).join(", "));
        root.changeView(routeName, params);
    };
}

var router = new director.Router();
router.param('guid', /([^\/]*)/);
router.param('createdOn', /([^\/]*)/);
router.on('/info', routeTo('info'));
router.on('/email', routeTo('email'));
router.on('/eligibility', routeTo('eligibility'));
router.on('/password_policy', routeTo('password_policy'));
router.on('/user_attributes', routeTo('user_attributes'));
router.on('/task_identifiers', routeTo('task_identifiers'));
router.on('/data_groups', routeTo('data_groups'));
router.on('/ve_template', routeTo('ve_template'));
router.on('/rp_template', routeTo('rp_template'));
router.on('/subpopulations/:guid/consents/history', routeTo('subpopulation_history', GUID));
router.on('/subpopulations/:guid/consents/download', routeTo('subpopulation_download', GUID));
router.on('/subpopulations/:guid/consents/:createdOn', routeTo('subpopulation_editor', GUID_CREATEDON));
router.on('/subpopulations/:guid', routeTo('subpopulation', GUID));
router.on('/subpopulations', routeTo('subpopulations'));
router.on('/reports/:identifier', routeTo('report', ID));
router.on('/reports', routeTo('reports'));
router.on('/surveys', routeTo('surveys'));
router.on('/surveys/:guid/:createdOn/versions', routeTo('survey_versions', GUID_CREATEDON));
router.on('/surveys/:guid/:createdOn/schema', routeTo('survey_schema', GUID_CREATEDON));
router.on('/surveys/:guid/:createdOn', routeTo('survey', GUID_CREATEDON));
router.on('/surveys/:guid', routeTo('survey', GUID));
router.on('/schemas', routeTo('schemas'));
router.on('/schemas/:schemaId', routeTo('schema', SCHEMAID));
router.on('/schemas/:schemaId/versions', routeTo('schema_versions', SCHEMAID));
router.on('/schemas/:schemaId/versions/:revision', routeTo('schema', SCHEMAID_REVISION));
router.on('/schedules', routeTo('schedules'));
router.on('/scheduleplans', routeTo('scheduleplans'));
router.on('/scheduleplans/:guid', routeTo('scheduleplan', GUID));
router.on('/synapse', routeTo('synapse'));
router.on('/lab_codes', routeTo('lab_codes'));
router.on('/externalIds', routeTo('external_ids'));
router.on('/participants/:userId/reports/:identifier/:name', routeTo('participant_report', USERID_IDENTIFIER_NAME));
router.on('/participants/:userId/consents/:name', routeTo('participant_consents', USERID_NAME));
router.on('/participants/:userId/reports/:name', routeTo('participant_reports', USERID_NAME));
router.on('/participants/:userId/:name', routeTo('participant', USERID_NAME));
router.on('/participants/:userId', routeTo('participant', USERID));
router.on('/participants', routeTo('participants'));
router.on('/admin/info', routeTo('admin_info'));
router.on('/admin/cache', routeTo('admin_cache'));

router.configure({
    notfound: routeTo('not_found'),
    'on': [ko.postbox.reset, function() {
        root.isEditorTabVisibleObs(false); 
    }]
});
router.init();
