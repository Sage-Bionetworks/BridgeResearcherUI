require('../css/main');
require('../lib/toastr.min');
require('../lib/dragula.min');
require('./bindings');
require('./registry');

var director = require('director');
var root = require('./root');

function routeTo(name) {
    return function () {
        root.changeView(name, {});
    };
}
function surveyRoute(name) {
    return function(guid, createdOn) {
        var date = null;
        try {
            if (createdOn) {
                date = new Date(createdOn)
                date.toISOString();
            }
        } catch(e) {
            date = null;
        }
        root.changeView(name, {guid: guid, createdOn: date});
    };
}
function schemaRoute(name) {
    return function(schemaId, revision) {
        root.changeView(name, {schemaId: schemaId, revision: (revision) ? revision : null});
    };
}
function schedulePlanRoute(name) {
    return function(guid) {
        root.changeView(name, {guid: guid});
    };
}

var router = new director.Router();
router.param('guid', /([^\/]*)/);
router.param('createdOn', /([^\/]*)/);
router.on('/info', routeTo('info'));
router.on('/consent', routeTo('consent'));
router.on('/eligibility', routeTo('eligibility'));
router.on('/password_policy', routeTo('password_policy'));
router.on('/user_attributes', routeTo('user_attributes'));
router.on('/verify_email_template', routeTo('ve_template'));
router.on('/reset_password_template', routeTo('rp_template'));
router.on('/actions', routeTo('actions'));
router.on('/surveys', routeTo('surveys'));
router.on('/surveys/:guid/:createdOn/versions', surveyRoute('survey_versions'));
router.on('/surveys/:guid/:createdOn/schema', surveyRoute('survey_schema'));
router.on('/surveys/:guid/:createdOn', surveyRoute('survey'));
router.on('/schemas', routeTo('schemas'));
router.on('/schemas/:schemaId', schemaRoute('schema'));
router.on('/schemas/:schemaId/versions', schemaRoute('schema_versions'));
router.on('/schemas/:schemaId/:revision', schemaRoute('schema'));
router.on('/monitor', routeTo('monitor'));
router.on('/schedules', routeTo('schedules'));
router.on('/scheduleplans', routeTo('scheduleplans'));
router.on('/scheduleplans/:guid', schedulePlanRoute('scheduleplan'));
router.configure({notfound: routeTo('not_found')});
router.init();

// Make this global for Semantic UI.
window.jQuery = require('jquery');
