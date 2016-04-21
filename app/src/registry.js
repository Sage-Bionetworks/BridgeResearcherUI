var ko = require('knockout');

function reg(name, path) {
    ko.components.register(name, { viewModel: require(path),
        template: require(path+".html"), synchronous: /dialogs/.test(path)
    });
}
function regt(name, path) {
    ko.components.register(name, {
        template: require(path+".html"), synchronous: /dialogs/.test(path)
    });
}
function setEditor(name, template, attribute) {
    ko.components.register(name, { template: require(template+'.html'),
        viewModel: require('./pages/set_editor/set_editor')(attribute),
        synchronous: false
    });
}

// Just leave this for now. This has been a real pain to get working.
ko.components.register('none', {template: '<div class="ui modal dialog"></div>'});

// PAGES
regt('start', './pages/start/start');
reg('errors','./widgets/errors/errors');
reg('info','./pages/info/info');
reg('email','./pages/email/email');
reg('consent','./pages/consent/consent');
reg('eligibility','./pages/eligibility/eligibility');
reg('password_policy','./pages/password_policy/password_policy');
reg('ve_template','./pages/ve_template/ve_template');
reg('rp_template','./pages/rp_template/rp_template');
reg('actions','./pages/actions/actions');
reg('subpopulations','./pages/subpopulations/subpopulations');
reg('subpopulation','./pages/subpopulation/subpopulation');
reg('surveys','./pages/surveys/surveys');
reg('survey', './pages/survey/survey');
reg('survey_versions','./pages/survey/survey_versions');
reg('survey_schema','./pages/survey/survey_schema');
reg('schemas', './pages/schemas/schemas');
reg('schema', './pages/schema/schema');
reg('schema_versions', './pages/schema/schema_versions');
reg('synapse', './pages/synapse/synapse');
reg('monitor', './pages/monitor/monitor');
reg('scheduleplans', './pages/scheduleplans/scheduleplans');
reg('scheduleplan', './pages/scheduleplan/scheduleplan');
reg('participants', './pages/participants/participants');
reg('participant', './pages/participant/participant');
reg('participant_consents', './pages/participant_consents/participant_consents');
reg('external_ids', './pages/external_ids/external_ids');
reg('schedule', './pages/schedule/schedule');
reg('SimpleScheduleStrategy', './pages/schedule/strategies/simple_strategy');
reg('ABTestScheduleStrategy', './pages/schedule/strategies/ab_strategy');
reg('CriteriaScheduleStrategy', './pages/schedule/strategies/criteria_strategy');
reg('ABTestScheduleStrategyPanel', './pages/schedule/panels/ab_strategy_panel');
reg('CriteriaScheduleStrategyPanel', './pages/schedule/panels/criteria_strategy_panel');
reg('SimpleScheduleStrategyPanel', './pages/schedule/panels/simple_strategy_panel');
reg('SurveyPanel', './pages/survey/panels/survey');

regt('not_found', './pages/not_found/not_found');
reg('publickey', './dialogs/publickey/publickey');

// Admin
reg('admin_info', './pages/admin/info/info');
reg('admin_cache', './pages/admin/cache/cache');

// DIALOGS
//regt('none_dialog','./dialogs/none/none');
reg('sign_in_dialog', './dialogs/sign_in/sign_in');
reg('forgot_password_dialog', './dialogs/forgot_password/forgot_password');
reg('enumeration_editor', './dialogs/enumeration_editor/enumeration_editor');
reg('event_id_editor', './dialogs/event_id_editor/event_id_editor');
reg('times_editor', './dialogs/times_editor/times_editor');
reg('rules_editor', './dialogs/rules_editor/rules_editor');
reg('date_window_editor', './dialogs/date_window_editor/date_window_editor');
reg('external_id_importer', './dialogs/external_id_importer/external_id_importer');
reg('participant_export', './dialogs/participant_export/participant_export');
reg('new_external_id', './dialogs/new_external_id/new_external_id');

/* SURVEYS */
regt('SurveyInfoScreen', './pages/survey/survey_info');
regt('SurveyQuestion', './pages/survey/survey_question');
reg('BooleanConstraints', './pages/survey/constraints/boolean_constraints');
reg('DateConstraints', './pages/survey/constraints/date_constraints');
reg('DateTimeConstraints', './pages/survey/constraints/datetime_constraints');
reg('DurationConstraints', './pages/survey/constraints/duration_constraints');
reg('TimeConstraints', './pages/survey/constraints/time_constraints');
reg('IntegerConstraints', './pages/survey/constraints/integer_constraints');
reg('DecimalConstraints', './pages/survey/constraints/decimal_constraints');
reg('StringConstraints', './pages/survey/constraints/string_constraints');
reg('MultiValueConstraints', './pages/survey/constraints/multi_constraints');

// Custom elements
regt('constraints-label', './pages/survey/constraints/constraints_label');
regt('ui-rules', './pages/survey/constraints/ui_rules');
regt('ui-checkbox', './widgets/form/ui_checkbox');
regt('ui-text', './widgets/form/ui_text');
regt('ui-number', './widgets/form/ui_number');
regt('ui-date', './widgets/form/ui_date');
regt('ui-datetime', './widgets/form/ui_datetime');
regt('ui-select', './widgets/form/ui_select');
regt('ui-textarea', './widgets/form/ui_textarea');
reg('ui-duration', './widgets/form/ui_duration');
reg('survey-tabset', './pages/survey/tabset');
reg('criteria', './widgets/criteria/criteria');
regt('fire-event', './widgets/fire_event');
regt('tag-editor', './widgets/tag_editor');
regt('settings-tabset', './widgets/settings_tabset');
regt('participant-tabset', './widgets/participant_tabset');
reg('pager', './widgets/pager/pager');
reg('ddb_pager', './widgets/ddb_pager/ddb_pager');

/* SCHEMAS */
reg('field_definition', './pages/schema/field_definition');
setEditor('user_attributes', './pages/user_attributes/user_attributes', 'userProfileAttributes');
setEditor('task_identifiers', './pages/task_identifiers/task_identifiers', 'taskIdentifiers');
setEditor('data_groups', './pages/data_groups/data_groups', 'dataGroups');
