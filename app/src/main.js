require('../css/main');
require('../lib/toastr.min');
require('../lib/dragula.min');

require('./bindings');
require('../lib/jquery.scrollTo');
require('./bindings/dragula');
require('./registry');
var ko = require('knockout');
require('knockout-postbox');

var director = require('director');
var root = require('./root');

function routeTo(name) {
    return function () {
        root.changeView(name, {});
    };
}
function surveyRoute(name) {
    return function(guid, createdOn) {
        var date = (createdOn === "recent") ? null : createdOn;
        root.changeView(name, {guid: guid, createdOn: date});
    };
}
function schemaRoute(name) {
    return function(schemaId, revision) {
        root.changeView(name, {schemaId: schemaId, revision: (revision) ? revision : null});
    };
}
function guidRoute(name) {
    return function(guid) {
        root.changeView(name, {guid: guid});
    };
}
function emailRoute(name) {
    return function(email) {
        root.changeView(name, {email: email});
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
router.on('/verify_email_template', routeTo('ve_template'));
router.on('/reset_password_template', routeTo('rp_template'));
router.on('/actions', routeTo('actions'));
router.on('/subpopulations/:guid/consents/:createdOn', surveyRoute('consent'));
router.on('/subpopulations/:guid', guidRoute('subpopulation'));
router.on('/subpopulations', routeTo('subpopulations'));
router.on('/surveys', routeTo('surveys'));
router.on('/surveys/:guid/:createdOn/versions', surveyRoute('survey_versions'));
router.on('/surveys/:guid/:createdOn/schema', surveyRoute('survey_schema'));
router.on('/surveys/:guid/:createdOn', surveyRoute('survey'));
router.on('/surveys/:guid', surveyRoute('survey')); // always new
router.on('/schemas', routeTo('schemas'));
router.on('/schemas/:schemaId', schemaRoute('schema'));
router.on('/schemas/:schemaId/versions', schemaRoute('schema_versions'));
router.on('/schemas/:schemaId/versions/:revision', schemaRoute('schema'));
router.on('/monitor', routeTo('monitor'));
router.on('/schedules', routeTo('schedules'));
router.on('/scheduleplans', routeTo('scheduleplans'));
router.on('/scheduleplans/:guid', guidRoute('scheduleplan'));
router.on('/synapse', routeTo('synapse'));
router.on('/externalIds', routeTo('external_ids'));
router.on('/participants/:email', emailRoute('participant'));
router.on('/participants/:email/consents', emailRoute('participant_consents'));
router.on('/participants', routeTo('participants'));

router.on('/admin/info', routeTo('admin_info'));
router.on('/admin/cache', routeTo('admin_cache'));

router.configure({
    notfound: routeTo('not_found'),
    'on': [
        ko.postbox.reset,
        function() { root.isEditorTabVisible(false); }
    ]
});
router.init();

window.addEventListener("load", function() {
    document.body.style.opacity = "1.0";
}, false);