require('../css/main');
require('../lib/toastr.min');
require('./bindings');
require('./registry');
var director = require('director');
var root = require('./root');

var router = new director.Router();
router.param('guid', /([^\/]*)/);
router.param('createdOn', /([^\/]*)/);
router.on('/info', root.routeTo('info'));
router.on('/consent', root.routeTo('consent'));
router.on('/eligibility', root.routeTo('eligibility'));
router.on('/password_policy', root.routeTo('password_policy'));
router.on('/user_attributes', root.routeTo('user_attributes'));
router.on('/verify_email_template', root.routeTo('ve_template'));
router.on('/reset_password_template', root.routeTo('rp_template'));
router.on('/actions', root.routeTo('actions'));
router.on('/surveys', root.routeTo('surveys'));
router.on('/surveys/:guid', root.surveyRoute('survey'));
router.on('/surveys/:guid/versions', root.surveyRoute('survey_versions'));
router.on('/surveys/:guid/:createdOn', root.surveyRoute('survey'));
router.on('/schemas', root.routeTo('schemas'));
router.on('/schemas/:schemaId', root.schemaRoute('schema'));
router.on('/schemas/:schemaId/versions', root.schemaRoute('schema_versions'));
router.on('/schemas/:schemaId/:revision', root.schemaRoute('schema'));
router.on('/monitor', root.routeTo('monitor'));
router.on('/schedules', root.routeTo('schedules'));
router.on('/scheduleplans', root.routeTo('scheduleplans'));
router.on('/scheduleplans/:guid', root.schedulePlanRoute('scheduleplan'));
router.configure({notfound: root.routeTo('not_found')});
router.init();

// Make this global for Semantic UI.
window.jQuery = require('jquery');;
