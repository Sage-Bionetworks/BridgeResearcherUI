import ko from 'knockout';

const reg = ko.components.register;
reg('errors', {
    viewModel: require('./widgets/errors/errors'),
    template: require('./widgets/errors/errors.html')
});
reg('shared_modules', {
    viewModel: require('./pages/shared_modules/shared_modules'), 
    template: require('./pages/shared_modules/shared_modules.html')
});
reg('none', {
    template: '<div class="ui modal dialog"></div>'
});
reg('dailyUploads', {
    viewModel: require('./pages/studyreports/dailyUploads'), 
    template: require('./pages/studyreports/dailyUploads.html')
});
reg('shared_module', {
    viewModel: require('./pages/shared_module/shared_module'), 
    template: require('./pages/shared_module/shared_module.html')
});
reg('shared_module_versions', {
    viewModel: require('./pages/shared_module/shared_module_versions'), 
    template: require('./pages/shared_module/shared_module_versions.html')
});
reg('sharedmodule-tabset', {
    viewModel: require('./pages/shared_module/tabset'),
    template: require('./pages/shared_module/tabset.html')
});
reg('studyreports-tabset', {
    template: require('./pages/studyreports/tabset.html')
});
reg('general', {
    viewModel: require('./pages/settings/general'),
    template: require('./pages/settings/general.html')
});
reg('email', {
    viewModel: require('./pages/settings/email'),
    template: require('./pages/settings/email.html')
});
reg('app_links', {
    viewModel: require('./pages/settings/applinks'),
    template: require('./pages/settings/applinks.html')
});
reg('password_policy', {
    viewModel: require('./pages/settings/password_policy'),
    template: require('./pages/settings/password_policy.html')
});
reg('oauth_providers', {
    viewModel: require('./pages/settings/oauth_providers'),
    template: require('./pages/settings/oauth_providers.html')
});
reg('install_links', {
    viewModel: require('./pages/settings/install_links'),
    template: require('./pages/settings/install_links.html')
});
reg('verify_email', {
    viewModel: require('./pages/email_templates/verify_email'),
    template: require('./pages/email_templates/verify_email.html')
});
reg('reset_password', {
    viewModel: require('./pages/email_templates/reset_password'),
    template: require('./pages/email_templates/reset_password.html')
});
reg('email_signin', {
    viewModel: require('./pages/email_templates/email_signin'),
    template: require('./pages/email_templates/email_signin.html')
});
reg('account_exists', {
    viewModel: require('./pages/email_templates/account_exists'),
    template: require('./pages/email_templates/account_exists.html')
});
reg('sms_verify_phone', {
    viewModel: require('./pages/sms_templates/verify_phone'),
    template: require('./pages/sms_templates/verify_phone.html')
});
reg('sms_reset_password', {
    viewModel: require('./pages/sms_templates/reset_password'),
    template: require('./pages/sms_templates/reset_password.html')
});
reg('sms_phone_signin', {
    viewModel: require('./pages/sms_templates/phone_signin'),
    template: require('./pages/sms_templates/phone_signin.html')
});
reg('sms_account_exists', {
    viewModel: require('./pages/sms_templates/account_exists'),
    template: require('./pages/sms_templates/account_exists.html')
});
reg('sms_app_install_link', {
    viewModel: require('./pages/sms_templates/app_install_link'),
    template: require('./pages/sms_templates/app_install_link.html')
});
reg('external_ids', {
    viewModel: require('./pages/external_ids/external_ids'),
    template: require('./pages/external_ids/external_ids.html')
});
reg('signUps', {
    viewModel: require('./pages/studyreports/signUps'),
    template: require('./pages/studyreports/signUps.html')
});
reg('reports', {
    viewModel: require('./pages/studyreports/reports'),
    template: require('./pages/studyreports/reports.html')
});
reg('report', {
    viewModel: require('./pages/studyreports/report'),
    template: require('./pages/studyreports/report.html')
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
reg('export_settings', {
    viewModel: require('./pages/export_settings/export_settings'),
    template: require('./pages/export_settings/export_settings.html')
});
reg('shared_upload_metadata', {
    viewModel: require('./pages/shared_upload_metadata/shared_upload_metadata'),
    template: require('./pages/shared_upload_metadata/shared_upload_metadata.html')
});
reg('scheduleplans', {
    viewModel: require('./pages/scheduleplans/scheduleplans'),
    template: require('./pages/scheduleplans/scheduleplans.html')
});
reg('scheduleplan', {
    viewModel: require('./pages/scheduleplan/scheduleplan'),
    template: require('./pages/scheduleplan/scheduleplan.html')
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
reg('participant_activity_events', {
    viewModel: require('./pages/participant/activity_events'),
    template: require('./pages/participant/activity_events.html')
});
reg('participant_activity', {
    viewModel: require('./pages/participant/activity'),
    template: require('./pages/participant/activity.html')
});
reg('participant_clientData', {
    viewModel: require('./pages/participant/client_data'),
    template: require('./pages/participant/client_data.html')
});

reg('participant_consents', {
    viewModel: require('./pages/participant/consents'),
    template: require('./pages/participant/consents.html')
});
reg('participant_reports', {
    viewModel: require('./pages/participant/reports'),
    template: require('./pages/participant/reports.html')
});
reg('participant_notifications', {
    viewModel: require('./pages/participant/notifications'),
    template: require('./pages/participant/notifications.html')
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
reg('tasks', {
    viewModel: require('./pages/tasks/tasks'),
    template: require('./pages/tasks/tasks.html')
});
reg('task', {
    viewModel: require('./pages/task/task'),
    template: require('./pages/task/task.html')
});
reg('topics', {
    viewModel: require('./pages/topics/topics'),
    template: require('./pages/topics/topics.html')
});
reg('topic', {
    viewModel: require('./pages/topic/topic'),
    template: require('./pages/topic/topic.html')
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
reg('WeightConstraints', {
    viewModel: require('./pages/survey/constraints/weight_constraints'),
    template: require('./pages/survey/constraints/weight_constraints.html')
});
reg('HeightConstraints', {
    viewModel: require('./pages/survey/constraints/height_constraints'),
    template: require('./pages/survey/constraints/height_constraints.html')
});
reg('BloodPressureConstraints', {
    viewModel: require('./pages/survey/constraints/bloodpressure_constraints.js'),
    template: require('./pages/survey/constraints/bloodpressure_constraints.html')
});
reg('tag-editor', {
    viewModel: require('./widgets/tag-editor/tag_editor'),
    template: require('./widgets/tag-editor/tag_editor.html')
});
reg('ui-duration', {
    viewModel: require('./widgets/form/ui_duration'),
    template: require('./widgets/form/ui_duration.html')
});
reg('survey-tabset', {
    viewModel: require('./pages/survey/tabset'),
    template: require('./pages/survey/tabset.html')
});
reg('template-tabset', {
    viewModel: require('./pages/email_templates/tabset'),
    template: require('./pages/email_templates/tabset.html')
});
reg('sms-template-tabset', {
    viewModel: require('./pages/sms_templates/tabset'),
    template: require('./pages/sms_templates/tabset.html')
});
reg('subpop-tabset', {
    viewModel: require('./pages/subpopulation/tabset'),
    template: require('./pages/subpopulation/tabset.html')
});
reg('criteria', {
    viewModel: require('./widgets/criteria/criteria'),
    template: require('./widgets/criteria/criteria.html')
});
reg('app_version_criteria', {
    viewModel: require('./widgets/criteria/criteria'),
    template: require('./widgets/criteria/app_version_criteria.html')
});
reg('participants_pager', {
    viewModel: require('./widgets/participants_pager/participants_pager'),
    template: require('./widgets/participants_pager/participants_pager.html')
});
reg('field_definition', {
    viewModel: require('./pages/schema/field_definition'),
    template: require('./pages/schema/field_definition.html')
});
reg('SurveyInfoScreen', {
    viewModel: require('./pages/survey/survey_info'),
    template: require('./pages/survey/survey_info.html')
});
reg('SurveyQuestion', {
    template: require('./pages/survey/survey_question.html')
});
reg('constraints-label', {
    template: require('./pages/survey/constraints/constraints_label.html')
});
reg('ui-rules', {
    viewModel: require('./pages/survey/constraints/ui_rules'),
    template: require('./pages/survey/constraints/ui_rules.html')
});
reg('ui-checkbox', {
    template: require('./widgets/form/ui_checkbox.html')
});
reg('ui-radio', {
    template: require('./widgets/form/ui_radio.html')
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
/* reg('fire-event', {
    template: require('./widgets/fire_event.html')
}); */
reg('settings-tabset', {
    template: require('./pages/settings/tabset.html')
});
reg('participant-tabset', {
    viewModel: require('./pages/participant/tabset'),
    template: require('./pages/participant/tabset.html')
});
reg('schema-tabset', {
    viewModel: require('./pages/schema/tabset'),
    template: require('./pages/schema/tabset.html')
});
reg('not_found', {
    template: require('./pages/not_found/not_found.html')
});
reg('shared-module', {
    viewModel: require('./widgets/shared_module/shared_module'),
    template: require('./widgets/shared_module/shared_module.html')
});
reg('forward-pager', {
    viewModel: require('./widgets/forward_pager/forward_pager'),
    template: require('./widgets/forward_pager/forward_pager.html')
});

// Dialogs. These must be synchronous.
reg('sign_out_user', {
    viewModel: require('./dialogs/sign_out_user/sign_out_user'),
    template: require('./dialogs/sign_out_user/sign_out_user.html'), synchronous: true
});
reg('module_browser', {
    viewModel: require('./dialogs/module_browser/module_browser'),
    template: require('./dialogs/module_browser/module_browser.html'), synchronous: true
});
reg('publickey', {
    viewModel: require('./dialogs/publickey/publickey'),
    template: require('./dialogs/publickey/publickey.html'), synchronous: true
});
reg('json_editor', {
    viewModel: require('./dialogs/json_editor/json_editor'),
    template: require('./dialogs/json_editor/json_editor.html'), synchronous: true
});
reg('read_about_clipboard', {
    viewModel: require('./dialogs/read_about_clipboard/read_about_clipboard'),
    template: require('./dialogs/read_about_clipboard/read_about_clipboard.html'), synchronous: true
});
reg('report_editor', {
    viewModel: require('./dialogs/report_editor/report_editor'),
    template: require('./dialogs/report_editor/report_editor.html'), synchronous: true
});
reg('sign_in_dialog', {
    viewModel: require('./dialogs/sign_in/sign_in'),
    template: require('./dialogs/sign_in/sign_in.html'), synchronous: true
});
reg('forgot_password_dialog', {
    viewModel: require('./dialogs/forgot_password/forgot_password'),
    template: require('./dialogs/forgot_password/forgot_password.html'), synchronous: true
});
reg('phone_signin_dialog', {
    viewModel: require('./dialogs/phone_signin/phone_signin'),
    template: require('./dialogs/phone_signin/phone_signin.html'), synchronous: true
});
reg('submit_code_dialog', {
    viewModel: require('./dialogs/phone_signin/submit_code'),
    template: require('./dialogs/phone_signin/submit_code.html'), synchronous: true
});
reg('enumeration_editor', {
    viewModel: require('./dialogs/enumeration_editor/enumeration_editor'),
    template: require('./dialogs/enumeration_editor/enumeration_editor.html'), synchronous: true
});
reg('multichoice_editor', {
    viewModel: require('./dialogs/multichoice_editor/multichoice_editor'),
    template: require('./dialogs/multichoice_editor/multichoice_editor.html'), synchronous: true
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
reg('copy_schemas', {
    viewModel: require('./dialogs/copy_schemas/copy_schemas'),
    template: require('./dialogs/copy_schemas/copy_schemas.html'), synchronous: true
});
reg('withdrawal', {
    viewModel: require('./dialogs/withdrawal/withdrawal'),
    template: require('./dialogs/withdrawal/withdrawal.html'), synchronous: true
});
reg('send_notification', {
    viewModel: require('./dialogs/send_notification/send_notification'),
    template: require('./dialogs/send_notification/send_notification.html'), synchronous: true
});
reg('select_schemas', {
    viewModel: require('./dialogs/select_schemas/select_schemas'),
    template: require('./dialogs/select_schemas/select_schemas.html'), synchronous: true
});
reg('select_surveys', {
    viewModel: require('./dialogs/select_surveys/select_surveys'),
    template: require('./dialogs/select_surveys/select_surveys.html'), synchronous: true
});
reg('edit_apple_link', {
    viewModel: require('./dialogs/edit_apple_link/edit_apple_link'),
    template: require('./dialogs/edit_apple_link/edit_apple_link.html'), synchronous: true
});
reg('edit_android_link', {
    viewModel: require('./dialogs/edit_android_link/edit_android_link'),
    template: require('./dialogs/edit_android_link/edit_android_link.html'), synchronous: true
});
reg('oauth_provider', {
    viewModel: require('./dialogs/oauth_provider/oauth_provider'),
    template: require('./dialogs/oauth_provider/oauth_provider.html'), synchronous: true
});
reg('appconfigs', {
    viewModel: require('./pages/appconfigs/appconfigs'),
    template: require('./pages/appconfigs/appconfigs.html')
});
reg('appconfig', {
    viewModel: require('./pages/appconfig/appconfig'),
    template: require('./pages/appconfig/appconfig.html')
});

// Attribute editors
reg('user_attributes', { 
    template: require('./pages/settings/user_attributes.html'),
    viewModel: require('./pages/set_editors/set_editor')('userProfileAttributes')
});
reg('event_keys', { 
    template: require('./pages/settings/event_keys.html'),
    viewModel: require('./pages/set_editors/set_editor')('activityEventKeys')
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