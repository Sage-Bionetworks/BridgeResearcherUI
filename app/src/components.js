var ko = require('knockout');
var reg = ko.components.register;

reg('none', {template: '<div class="ui modal dialog"></div>'});

reg('start', {
    template: require('./pages/start/start.html')
});
reg('errors', {
    viewModel: require('./widgets/errors/errors'),
    template: require('./widgets/errors/errors.html')
});
reg('general', {
    viewModel: require('./pages/settings/general'),
    template: require('./pages/settings/general.html')
});
reg('email', {
    viewModel: require('./pages/settings/email'),
    template: require('./pages/settings/email.html')
});
reg('eligibility', {
    viewModel: require('./pages/settings/eligibility'),
    template: require('./pages/settings/eligibility.html')
});
reg('password_policy', {
    viewModel: require('./pages/settings/password_policy'),
    template: require('./pages/settings/password_policy.html')
});
reg('verify_email', {
    viewModel: require('./pages/email_templates/verify_email'),
    template: require('./pages/email_templates/verify_email.html')
});
reg('reset_password', {
    viewModel: require('./pages/email_templates/reset_password'),
    template: require('./pages/email_templates/reset_password.html')
});
reg('reports', {
    viewModel: require('./pages/reports/reports'),
    template: require('./pages/reports/reports.html')
});
reg('report', {
    viewModel: require('./pages/report/report'),
    template: require('./pages/report/report.html')
});
reg('subpopulations', {
    viewModel: require('./pages/subpopulations/subpopulations'),
    template: require('./pages/subpopulations/subpopulations.html')
});
reg('subpopulation', {
    viewModel: require('./pages/subpopulation/general'),
    template: require('./pages/subpopulation/general.html')
});
reg('subpopulation_editor', {
    viewModel: require('./pages/subpopulation/editor'),
    template: require('./pages/subpopulation/editor.html')
});
reg('subpopulation_history', {
    viewModel: require('./pages/subpopulation/history'),
    template: require('./pages/subpopulation/history.html')
});
reg('subpopulation_download', {
    viewModel: require('./pages/subpopulation/download'),
    template: require('./pages/subpopulation/download.html')
});
reg('surveys', {
    viewModel: require('./pages/surveys/surveys'),
    template: require('./pages/surveys/surveys.html')
});
reg('survey', {
    viewModel: require('./pages/survey/survey'),
    template: require('./pages/survey/survey.html')
});
reg('survey_versions', {
    viewModel: require('./pages/survey/survey_versions'),
    template: require('./pages/survey/survey_versions.html')
});
reg('survey_schema', {
    viewModel: require('./pages/survey/survey_schema'),
    template: require('./pages/survey/survey_schema.html')
});
reg('schemas', {
    viewModel: require('./pages/schemas/schemas'),
    template: require('./pages/schemas/schemas.html')
});
reg('schema', {
    viewModel: require('./pages/schema/schema'),
    template: require('./pages/schema/schema.html')
});
reg('schema_versions', {
    viewModel: require('./pages/schema/schema_versions'),
    template: require('./pages/schema/schema_versions.html')
});
reg('synapse', {
    viewModel: require('./pages/settings/synapse'),
    template: require('./pages/settings/synapse.html')
});
reg('scheduleplans', {
    viewModel: require('./pages/scheduleplans/scheduleplans'),
    template: require('./pages/scheduleplans/scheduleplans.html')
});
reg('scheduleplan', {
    viewModel: require('./pages/scheduleplan/scheduleplan'),
    template: require('./pages/scheduleplan/scheduleplan.html')
});
reg('enrollees', {
    viewModel: require('./pages/enrollees/enrollees'),
    template: require('./pages/enrollees/enrollees.html')
});
reg('participants', {
    viewModel: require('./pages/participants/participants'),
    template: require('./pages/participants/participants.html')
});
reg('participant_general', {
    viewModel: require('./pages/participant/general'),
    template: require('./pages/participant/general.html')
});
reg('participant_activities', {
    viewModel: require('./pages/participant/activities'),
    template: require('./pages/participant/activities.html')
});
reg('participant_consents', {
    viewModel: require('./pages/participant/consents'),
    template: require('./pages/participant/consents.html')
});
reg('participant_reports', {
    viewModel: require('./pages/participant/reports'),
    template: require('./pages/participant/reports.html')
});
reg('participant_report', {
    viewModel: require('./pages/participant/report'),
    template: require('./pages/participant/report.html')
});
reg('participant_uploads', {
    viewModel: require('./pages/participant/uploads'),
    template: require('./pages/participant/uploads.html')
});
reg('participant_request_info', {
    viewModel: require('./pages/participant/request_info'),
    template: require('./pages/participant/request_info.html')
});
reg('schedule', {
    viewModel: require('./pages/schedule/schedule'),
    template: require('./pages/schedule/schedule.html')
});
reg('SimpleScheduleStrategy', {
    viewModel: require('./pages/schedule/strategies/simple_strategy'),
    template: require('./pages/schedule/strategies/simple_strategy.html')
});
reg('ABTestScheduleStrategy', {
    viewModel: require('./pages/schedule/strategies/ab_strategy'),
    template: require('./pages/schedule/strategies/ab_strategy.html')
});
reg('CriteriaScheduleStrategy', {
    viewModel: require('./pages/schedule/strategies/criteria_strategy'),
    template: require('./pages/schedule/strategies/criteria_strategy.html')
});
reg('ABTestScheduleStrategyPanel', {
    viewModel: require('./pages/schedule/panels/ab_strategy_panel'),
    template: require('./pages/schedule/panels/ab_strategy_panel.html')
});
reg('CriteriaScheduleStrategyPanel', {
    viewModel: require('./pages/schedule/panels/criteria_strategy_panel'),
    template: require('./pages/schedule/panels/criteria_strategy_panel.html')
});
reg('SimpleScheduleStrategyPanel', {
    viewModel: require('./pages/schedule/panels/simple_strategy_panel'),
    template: require('./pages/schedule/panels/simple_strategy_panel.html')
});
reg('SurveyPanel', {
    viewModel: require('./pages/survey/panels/survey'),
    template: require('./pages/survey/panels/survey.html')
});
reg('admin_info', {
    viewModel: require('./pages/admin/info/info'),
    template: require('./pages/admin/info/info.html')
});
reg('admin_cache', {
    viewModel: require('./pages/admin/cache/cache'),
    template: require('./pages/admin/cache/cache.html')
});
reg('BooleanConstraints', {
    viewModel: require('./pages/survey/constraints/boolean_constraints'),
    template: require('./pages/survey/constraints/boolean_constraints.html')
});
reg('DateConstraints', {
    viewModel: require('./pages/survey/constraints/date_constraints'),
    template: require('./pages/survey/constraints/date_constraints.html')
});
reg('DateTimeConstraints', {
    viewModel: require('./pages/survey/constraints/datetime_constraints'),
    template: require('./pages/survey/constraints/datetime_constraints.html')
});
reg('DurationConstraints', {
    viewModel: require('./pages/survey/constraints/duration_constraints'),
    template: require('./pages/survey/constraints/duration_constraints.html')
});
reg('TimeConstraints', {
    viewModel: require('./pages/survey/constraints/time_constraints'),
    template: require('./pages/survey/constraints/time_constraints.html')
});
reg('IntegerConstraints', {
    viewModel: require('./pages/survey/constraints/integer_constraints'),
    template: require('./pages/survey/constraints/integer_constraints.html')
});
reg('DecimalConstraints', {
    viewModel: require('./pages/survey/constraints/decimal_constraints'),
    template: require('./pages/survey/constraints/decimal_constraints.html')
});
reg('StringConstraints', {
    viewModel: require('./pages/survey/constraints/string_constraints'),
    template: require('./pages/survey/constraints/string_constraints.html')
});
reg('MultiValueConstraints', {
    viewModel: require('./pages/survey/constraints/multi_constraints'),
    template: require('./pages/survey/constraints/multi_constraints.html')
});
reg('ui-duration', {
    viewModel: require('./widgets/form/ui_duration'),
    template: require('./widgets/form/ui_duration.html')
});
reg('survey-tabset', {
    viewModel: require('./pages/survey/tabset'),
    template: require('./pages/survey/tabset.html')
});
reg('criteria', {
    viewModel: require('./widgets/criteria/criteria'),
    template: require('./widgets/criteria/criteria.html')
});
reg('pager', {
    viewModel: require('./widgets/pager/pager'),
    template: require('./widgets/pager/pager.html')
});
reg('ddb_pager', {
    viewModel: require('./widgets/ddb_pager/ddb_pager'),
    template: require('./widgets/ddb_pager/ddb_pager.html')
});
reg('field_definition', {
    viewModel: require('./pages/schema/field_definition'),
    template: require('./pages/schema/field_definition.html')
});
reg('SurveyInfoScreen', {
    template: require('./pages/survey/survey_info.html')
});
reg('SurveyQuestion', {
    template: require('./pages/survey/survey_question.html')
});
reg('constraints-label', {
    template: require('./pages/survey/constraints/constraints_label.html')
});
reg('ui-rules', {
    template: require('./pages/survey/constraints/ui_rules.html')
});
reg('ui-checkbox', {
    template: require('./widgets/form/ui_checkbox.html')
});
reg('ui-date', {
    template: require('./widgets/form/ui_date.html')
});
reg('ui-datetime', {
    template: require('./widgets/form/ui_datetime.html')
});
reg('ui-select', {
    template: require('./widgets/form/ui_select.html')
});
reg('ui-textarea', {
    template: require('./widgets/form/ui_textarea.html')
});
reg('fire-event', {
    template: require('./widgets/fire_event.html')
});
reg('tag-editor', {
    template: require('./widgets/tag_editor.html')
});
reg('settings-tabset', {
    template: require('./pages/settings/settings_tabset.html')
});
reg('participant-tabset', {
    template: require('./pages/participant/participant_tabset.html')
});
reg('not_found', {
    template: require('./pages/not_found/not_found.html')
});

// Dialogs. These must be synchronous.
reg('publickey', {
    viewModel: require('./dialogs/publickey/publickey'),
    template: require('./dialogs/publickey/publickey.html'), synchronous: true
});
reg('read_about_clipboard', {
    viewModel: require('./dialogs/read_about_clipboard/read_about_clipboard'),
    template: require('./dialogs/read_about_clipboard/read_about_clipboard.html'), synchronous: true
});
reg('add_report', {
    viewModel: require('./dialogs/add_report/add_report'),
    template: require('./dialogs/add_report/add_report.html'), synchronous: true
});
reg('edit_report', {
    viewModel: require('./dialogs/edit_report/edit_report'),
    template: require('./dialogs/edit_report/edit_report.html'), synchronous: true
});
reg('sign_in_dialog', {
    viewModel: require('./dialogs/sign_in/sign_in'),
    template: require('./dialogs/sign_in/sign_in.html'), synchronous: true
});
reg('forgot_password_dialog', {
    viewModel: require('./dialogs/forgot_password/forgot_password'),
    template: require('./dialogs/forgot_password/forgot_password.html'), synchronous: true
});
reg('enumeration_editor', {
    viewModel: require('./dialogs/enumeration_editor/enumeration_editor'),
    template: require('./dialogs/enumeration_editor/enumeration_editor.html'), synchronous: true
});
reg('event_id_editor', {
    viewModel: require('./dialogs/event_id_editor/event_id_editor'),
    template: require('./dialogs/event_id_editor/event_id_editor.html'), synchronous: true
});
reg('times_editor', {
    viewModel: require('./dialogs/times_editor/times_editor'),
    template: require('./dialogs/times_editor/times_editor.html'), synchronous: true
});
reg('rules_editor', {
    viewModel: require('./dialogs/rules_editor/rules_editor'),
    template: require('./dialogs/rules_editor/rules_editor.html'), synchronous: true
});
reg('date_window_editor', {
    viewModel: require('./dialogs/date_window_editor/date_window_editor'),
    template: require('./dialogs/date_window_editor/date_window_editor.html'), synchronous: true
});
reg('external_id_importer', {
    viewModel: require('./dialogs/external_id_importer/external_id_importer'),
    template: require('./dialogs/external_id_importer/external_id_importer.html'), synchronous: true
});
reg('participant_export', {
    viewModel: require('./dialogs/participant_export/participant_export'),
    template: require('./dialogs/participant_export/participant_export.html'), synchronous: true
});
reg('new_external_id', {
    viewModel: require('./dialogs/new_external_id/new_external_id'),
    template: require('./dialogs/new_external_id/new_external_id.html'), synchronous: true
});
reg('copy_schemas', {
    viewModel: require('./dialogs/copy_schemas/copy_schemas'),
    template: require('./dialogs/copy_schemas/copy_schemas.html'), synchronous: true
});
reg('withdrawal', {
    viewModel: require('./dialogs/withdrawal/withdrawal'),
    template: require('./dialogs/withdrawal/withdrawal.html'), synchronous: true
});

// Attribute editors
reg('user_attributes', { 
    template: require('./pages/settings/user_attributes.html'),
    viewModel: require('./pages/set_editors/set_editor')('userProfileAttributes')
});
reg('task_identifiers', { 
    template: require('./pages/set_editors/task_identifiers.html'),
    viewModel: require('./pages/set_editors/set_editor')('taskIdentifiers')
});
reg('data_groups', { 
    template: require('./pages/settings/data_groups.html'),
    viewModel: require('./pages/set_editors/set_editor')('dataGroups')
});
reg('empty', {
    template: '<span></span>'
});