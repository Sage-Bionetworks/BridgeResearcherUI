import ko from "knockout";

import errors from "./widgets/errors/errors";
import errorsHtml from "./widgets/errors/errors.html";

import assessments from "./pages/assessments/assessments";
import assessmentsHtml from "./pages/assessments/assessments.html";

import assessment from "./pages/assessment/general";
import assessmentHtml from "./pages/assessment/general.html";
import assessmentUi from "./pages/assessment/ui";
import assessmentUiHtml from "./pages/assessment/ui.html";
import assessmentConfig from "./pages/assessment/config";
import assessmentConfigHtml from "./pages/assessment/config.html";
import assessmentTemplate from "./pages/assessment/template";
import assessmentTemplateHtml from "./pages/assessment/template.html";
import assessmentHistory from "./pages/assessment/history";
import assessmentHistoryHtml from "./pages/assessment/history.html";
import assessmentResources from "./pages/assessment/resources";
import assessmentResourcesHtml from "./pages/assessment/resources.html";
import assessmentResource from "./pages/assessment/resource";
import assessmentResourceHtml from "./pages/assessment/resource.html";
import assessmentCustomize from "./pages/assessment/customize";
import assessmentCustomizeHtml from "./pages/assessment/customize.html";
import assessmentTabs from "./pages/assessment/tabset";
import assessmentTabsHtml from "./pages/assessment/tabset.html";

import sharedassessments from "./pages/sharedassessments/sharedassessments";
import sharedassessmentsHtml from "./pages/sharedassessments/sharedassessments.html";

import sharedassessment from "./pages/sharedassessment/general";
import sharedassessmentHtml from "./pages/sharedassessment/general.html";
import sharedassessmentUi from "./pages/sharedassessment/ui";
import sharedassessmentUiHtml from "./pages/sharedassessment/ui.html";
import sharedassessmentHistory from "./pages/sharedassessment/history";
import sharedassessmentHistoryHtml from "./pages/sharedassessment/history.html";
import sharedassessmentConfig from "./pages/sharedassessment/config";
import sharedassessmentConfigHtml from "./pages/sharedassessment/config.html";
import sharedassessmentResources from "./pages/sharedassessment/resources";
import sharedassessmentResourcesHtml from "./pages/sharedassessment/resources.html";
import sharedassessmentResource from "./pages/sharedassessment/resource";
import sharedassessmentResourceHtml from "./pages/sharedassessment/resource.html";
import sharedassessmentTabs from "./pages/sharedassessment/tabset";
import sharedassessmentTabsHtml from "./pages/sharedassessment/tabset.html";

import tags from "./pages/admin/tags/tags";
import tagsHtml from "./pages/admin/tags/tags.html";

import dailyUploads from "./pages/studyreports/dailyUploads";
import dailyUploadsHtml from "./pages/studyreports/dailyUploads.html";

import retention from "./pages/studyreports/retention";
import retentionHtml from "./pages/studyreports/retention.html";
import studyReportsTabset from "./pages/studyreports/tabset";
import studyReportsTabsetHtml from "./pages/studyreports/tabset.html";

// Settings
import general from "./pages/settings/general";
import generalHtml from "./pages/settings/general.html";
import email from "./pages/settings/email";
import emailHtml from "./pages/settings/email.html";
import applinks from "./pages/settings/applinks";
import applinksHtml from "./pages/settings/applinks.html";
import passwordPolicy from "./pages/settings/password_policy";
import passwordPolicyHtml from "./pages/settings/password_policy.html";
import oauthProviders from "./pages/settings/oauth_providers";
import oauthProvidersHtml from "./pages/settings/oauth_providers.html";
import installLinks from "./pages/settings/install_links";
import installLinksHtml from "./pages/settings/install_links.html";
import advanced from "./pages/settings/advanced";
import advancedHtml from "./pages/settings/advanced.html";
import dataGroups from "./pages/settings/data_groups.html";
import userAtts from "./pages/settings/user_attributes.html";
import settingsTabset from "./pages/settings/tabset";
import settingsTabsetHtml from "./pages/settings/tabset.html";

// study reports
import signUps from "./pages/studyreports/signUps";
import signUpsHtml from "./pages/studyreports/signUps.html";
import reports from "./pages/studyreports/reports";
import reportsHtml from "./pages/studyreports/reports.html";
import report from "./pages/studyreports/report";
import reportHtml from "./pages/studyreports/report.html";

import subpops from "./pages/subpopulations/subpopulations";
import subpopsHtml from "./pages/subpopulations/subpopulations.html";

import subpop from "./pages/subpopulation/general";
import subpopHtml from "./pages/subpopulation/general.html";
import subpopEditor from "./pages/subpopulation/editor";
import subpopEditorHtml from "./pages/subpopulation/editor.html";
import subpopHistory from "./pages/subpopulation/history";
import subpopHistoryHtml from "./pages/subpopulation/history.html";
import subpopDl from "./pages/subpopulation/download";
import subpopDlHtml from "./pages/subpopulation/download.html";
import subpopTabset from "./pages/subpopulation/tabset";
import subpopTabsetHtml from "./pages/subpopulation/tabset.html";

import surveys from "./pages/surveys/surveys";
import surveysHtml from "./pages/surveys/surveys.html";

import survey from "./pages/survey/survey";
import surveyHtml from "./pages/survey/survey.html";
import surveyVers from "./pages/survey/survey_versions";
import surveyVersHtml from "./pages/survey/survey_versions.html";
import surveySchema from "./pages/survey/survey_schema";
import surveySchemaHtml from "./pages/survey/survey_schema.html";
import surveyPanel from "./pages/survey/panels/survey";
import surveyPanelHtml from "./pages/survey/panels/survey.html";
import ss from "./pages/schedule/strategies/simple_strategy";
import ssHtml from "./pages/schedule/strategies/simple_strategy.html";
import abs from "./pages/schedule/strategies/ab_strategy";
import absHtml from "./pages/schedule/strategies/ab_strategy.html";
import cs from "./pages/schedule/strategies/criteria_strategy";
import csHtml from "./pages/schedule/strategies/criteria_strategy.html";
import absPanel from "./pages/schedule/panels/ab_strategy_panel";
import absPanelHtml from "./pages/schedule/panels/ab_strategy_panel.html";
import csPanel from "./pages/schedule/panels/criteria_strategy_panel";
import csPanelHtml from "./pages/schedule/panels/criteria_strategy_panel.html";
import ssPanel from "./pages/schedule/panels/simple_strategy_panel";
import ssPanelHtml from "./pages/schedule/panels/simple_strategy_panel.html";
import boolConst from "./pages/survey/constraints/boolean_constraints";
import boolConstHtml from "./pages/survey/constraints/boolean_constraints.html";
import dateConst from "./pages/survey/constraints/date_constraints";
import dateConstHtml from "./pages/survey/constraints/date_constraints.html";
import dateTimeConst from "./pages/survey/constraints/datetime_constraints";
import dateTimeConstHtml from "./pages/survey/constraints/datetime_constraints.html";
import yearMonthConst from "./pages/survey/constraints/yearmonth_constraints";
import yearMonthConstHtml from "./pages/survey/constraints/yearmonth_constraints.html";
import yearConst from "./pages/survey/constraints/year_constraints";
import yearConstHtml from "./pages/survey/constraints/year_constraints.html";
import postalConst from "./pages/survey/constraints/postalcode_constraints";
import postalConstHtml from "./pages/survey/constraints/postalcode_constraints.html";
import durationConst from "./pages/survey/constraints/duration_constraints";
import durationConstHtml from "./pages/survey/constraints/duration_constraints.html";
import timeConst from "./pages/survey/constraints/time_constraints";
import timeConstHtml from "./pages/survey/constraints/time_constraints.html";
import intConst from "./pages/survey/constraints/integer_constraints";
import intConstHtml from "./pages/survey/constraints/integer_constraints.html";
import decConst from "./pages/survey/constraints/decimal_constraints";
import decConstHtml from "./pages/survey/constraints/decimal_constraints.html";
import strConst from "./pages/survey/constraints/string_constraints";
import strConstHtml from "./pages/survey/constraints/string_constraints.html"
import mvConst from "./pages/survey/constraints/multi_constraints";
import mvConstHtml from "./pages/survey/constraints/multi_constraints.html";
import weightConst from "./pages/survey/constraints/weight_constraints";
import weightConstHtml from "./pages/survey/constraints/weight_constraints.html";
import heightConst from "./pages/survey/constraints/height_constraints";
import heightConstHtml from "./pages/survey/constraints/height_constraints.html";
import bpConst from "./pages/survey/constraints/bloodpressure_constraints.js";
import bpConstHtml from "./pages/survey/constraints/bloodpressure_constraints.html";
import surveyTabset from "./pages/survey/tabset";
import surveyTabsetHtml from "./pages/survey/tabset.html";
import infoScreen from "./pages/survey/survey_info";
import infoScreenHtml from "./pages/survey/survey_info.html";
import questionHtml from "./pages/survey/survey_question.html";
import constLabelHtml from "./pages/survey/constraints/constraints_label.html";
import rules from "./pages/survey/constraints/ui_rules";
import rulesHtml from "./pages/survey/constraints/ui_rules.html";

import schemas from "./pages/schemas/schemas";
import schemasHtml from "./pages/schemas/schemas.html";

import schema from "./pages/schema/schema";
import schemaHtml from "./pages/schema/schema.html";
import schemaVers from "./pages/schema/schema_versions";
import schemaVersHtml from "./pages/schema/schema_versions.html";

import exportSettings from "./pages/export_settings/export_settings";
import exportSettingsHtml from "./pages/export_settings/export_settings.html";

import uploadMetadata from "./pages/shared_upload_metadata/shared_upload_metadata";
import uploadMetadataHtml from "./pages/shared_upload_metadata/shared_upload_metadata.html";

import scheduleplans from "./pages/scheduleplans/scheduleplans";
import scheduleplansHtml from "./pages/scheduleplans/scheduleplans.html";

import scheduleplan from "./pages/scheduleplan/scheduleplan";
import scheduleplanHtml from "./pages/scheduleplan/scheduleplan.html";

import participants from "./pages/participants/participants";
import participantsHtml from "./pages/participants/participants.html";
import partPager from "./pages/participants/pager";
import partPagerHtml from "./pages/participants/pager.html";

import partGeneral from "./pages/participant/general";
import partGeneralHtml from "./pages/participant/general.html";
import partActivities from "./pages/participant/activities";
import partActivitiesHtml from "./pages/participant/activities.html";
import partEvents from "./pages/participant/activity_events";
import partEventsHtml from "./pages/participant/activity_events.html";
import partActivity from "./pages/participant/activity";
import partActivityHtml from "./pages/participant/activity.html";
import partClientData from "./pages/participant/client_data";
import partClientDataHtml from "./pages/participant/client_data.html";
import partEnrollments from "./pages/participant/enrollments";
import partEnrollmentsHtml from "./pages/participant/enrollments.html";
import partConsents from "./pages/participant/consents";
import partConsentsHtml from "./pages/participant/consents.html";
import partReports from "./pages/participant/reports";
import partReportsHtml from "./pages/participant/reports.html";
import partNots from "./pages/participant/notifications";
import partNotsHtml from "./pages/participant/notifications.html";
import partReport from "./pages/participant/report";
import partReportHtml from "./pages/participant/report.html";
import partUploads from "./pages/participant/uploads";
import partUploadsHtml from "./pages/participant/uploads.html";
import partUpload from "./pages/participant/upload";
import partUploadHtml from "./pages/participant/upload.html";
import partRequestInfo from "./pages/participant/request_info";
import partRequestInfoHtml from "./pages/participant/request_info.html";
import verifiedIcon from "./pages/participant/verified-icon";
import verifiedIconHtml from "./pages/participant/verified-icon.html";
import partTabset from "./pages/participant/tabset";
import partTabsetHtml from "./pages/participant/tabset.html";

import setEditor from "./pages/set_editors/set_editor"; // however, this is a widget

import taskIdentifiers from "./pages/set_editors/task_identifiers.html";

import autoCustomEvents from "./pages/events/auto_custom_events";
import autoCustomEventsHtml from "./pages/events/auto_custom_events.html";
import customEvents from "./pages/events/custom_events";
import customEventsHtml from "./pages/events/custom_events.html";
import eventsTabsetHtml from "./pages/events/tabset.html";

import topics from "./pages/topics/topics";
import topicsHtml from "./pages/topics/topics.html";

import topic from "./pages/topic/topic";
import topicHtml from "./pages/topic/topic.html";

import files from "./pages/files/files";
import filesHtml from "./pages/files/files.html";

import file from "./pages/file/file";
import fileHtml from "./pages/file/file.html";

import schedule from "./pages/schedule/schedule";
import scheduleHtml from "./pages/schedule/schedule.html";

import uploads from "./pages/uploads/uploads";
import uploadsHtml from "./pages/uploads/uploads.html";

import upload from "./pages/upload/upload";
import uploadHtml from "./pages/upload/upload.html";

import adminCache from "./pages/admin/cache/cache";
import adminCacheHtml from "./pages/admin/cache/cache.html";

import adminApps from "./pages/admin/apps/apps";
import adminAppsHtml from "./pages/admin/apps/apps.html";

import adminApp from "./pages/admin/app/app";
import adminAppHtml from "./pages/admin/app/app.html";

// import adminMasterSchedules from "./pages/admin/masterschedules/masterschedules";
// import adminMasterSchedulesHtml from "./pages/admin/masterschedules/masterschedules.html";

import orgs from "./pages/organizations/organizations";
import orgsHtml from "./pages/organizations/organizations.html";

import orgEditor from "./pages/organization/editor";
import orgEditorHtml from "./pages/organization/editor.html";
import orgMembers from "./pages/organization/members";
import orgMembersHtml from "./pages/organization/members.html";
import memGeneral from "./pages/member/general";
import memGeneralHtml from "./pages/member/general.html";
import memClientData from "./pages/member/client_data";
import memClientDataHtml from "./pages/member/client_data.html";
import memRequestInfo from "./pages/member/request_info";
import memRequestInfoHtml from "./pages/member/request_info.html";
import memTabset from "./pages/member/tabset";
import memTabsetHtml from "./pages/member/tabset.html";
import memBreadcrumb from "./pages/member/breadcrumb";
import memBreadcrumbHtml from "./pages/member/breadcrumb.html";

import orgStudies from "./pages/organization/studies";
import orgStudiesHtml from "./pages/organization/studies.html";
import orgTabset from "./pages/organization/tabset";
import orgTabsetHtml from "./pages/organization/tabset.html";

import studies from "./pages/studies/studies";
import studiesHtml from "./pages/studies/studies.html";

import studyEditor from "./pages/study/editor";
import studyEditorHtml from "./pages/study/editor.html";
import studyUi from "./pages/study/ui";
import studyUiHtml from "./pages/study/ui.html";
import studySponsors from "./pages/study/sponsors";
import studySponsorsHtml from "./pages/study/sponsors.html";
import studyEnrollments from "./pages/study/enrollments";
import studyEnrollmentsHtml from "./pages/study/enrollments.html";
import externalIds from "./pages/study/external_ids";
import externalIdsHtml from "./pages/study/external_ids.html";
import studyClientData from "./pages/study/client_data";
import studyClientDataHtml from "./pages/study/client_data.html";
import studyTabset from "./pages/study/tabset";
import studyTabsetHtml from "./pages/study/tabset.html";
import studyContact from "./pages/study/contact";
import studyContactHtml from "./pages/study/contact.html";

import studyparticipants from "./pages/study/studyparticipants";
import studyparticipantsHtml from "./pages/study/studyparticipants.html";

// ???
import studypartPager from "./pages/study/pager";
import studypartPagerHtml from "./pages/study/pager.html";

import studypartGeneral from "./pages/studyparticipant/general";
import studypartGeneralHtml from "./pages/studyparticipant/general.html";
import studypartEnrollments from "./pages/studyparticipant/enrollments";
import studypartEnrollmentsHtml from "./pages/studyparticipant/enrollments.html";
import studypartUploads from "./pages/studyparticipant/uploads";
import studypartUploadsHtml from "./pages/studyparticipant/uploads.html";
import studypartUpload from "./pages/studyparticipant/upload";
import studypartUploadHtml from "./pages/studyparticipant/upload.html";
import studypartNots from "./pages/studyparticipant/notifications";
import studypartNotsHtml from "./pages/studyparticipant/notifications.html";
import studypartTabset from "./pages/studyparticipant/tabset";
import studypartTabsetHtml from "./pages/studyparticipant/tabset.html";
import studypartReports from "./pages/studyparticipant/reports";
import studypartReportsHtml from "./pages/studyparticipant/reports.html";
import studypartReport from "./pages/studyparticipant/report";
import studypartReportHtml from "./pages/studyparticipant/report.html";
import studypartClientData from "./pages/studyparticipant/client_data";
import studypartClientDataHtml from "./pages/studyparticipant/client_data.html";
import studypartRequestInfo from "./pages/studyparticipant/request_info";
import studypartRequestInfoHtml from "./pages/studyparticipant/request_info.html";
import studypartSchedule from "./pages/studyparticipant/schedule";
import studypartScheduleHtml from "./pages/studyparticipant/schedule.html";
import studypartHistory from "./pages/studyparticipant/history";
import studypartHistoryHtml from "./pages/studyparticipant/history.html";
import studypartTimeline from "./pages/studyparticipant/timeline";
import studypartTimelineHtml from "./pages/studyparticipant/timeline.html";
import studypartConsents from "./pages/studyparticipant/consents";
import studypartConsentsHtml from "./pages/studyparticipant/consents.html";
import studypartAdherence from "./pages/studyparticipant/adherence";
import studypartAdherenceHtml from "./pages/studyparticipant/adherence.html";
import studypartAdherenceSearch from "./pages/studyparticipant/search";
import studypartAdherenceSearchHtml from "./pages/studyparticipant/search.html";

import schedules2 from "./pages/schedules2/schedules";
import schedules2Html from "./pages/schedules2/schedules.html";
import schedule2 from "./pages/schedule2/schedule";
import schedule2Html from "./pages/schedule2/schedule.html";
import session from "./pages/schedule2/session";
import sessionHtml from "./pages/schedule2/session.html";
import timeWindow from "./pages/schedule2/time_window";
import timeWindowHtml from "./pages/schedule2/time_window.html";
import assessmentRef from "./pages/schedule2/assessment_ref";
import assessmentRefHtml from "./pages/schedule2/assessment_ref.html";
import messageRef from "./pages/schedule2/message";
import messageRefHtml from "./pages/schedule2/message.html";
import label from "./pages/schedule2/label";
import labelHtml from "./pages/schedule2/label.html";
import selectAssessmentRefs from "./dialogs/select_assessment_refs/select_assessment_refs";
import selectAssessmentRefsHtml from "./dialogs/select_assessment_refs/select_assessment_refs.html";
import previewTimeline from "./dialogs/preview_timeline/preview_timeline";
import previewTimelineHtml from "./dialogs/preview_timeline/preview_timeline.html";
import notification from "./pages/schedule2/notification";
import notificationHtml from "./pages/schedule2/notification.html";

import schemaTabset from "./pages/schema/tabset";
import schemaTabsetHtml from "./pages/schema/tabset.html";
import fieldDef from "./pages/schema/field_definition";
import fieldDefHtml from "./pages/schema/field_definition.html";

import appConfigs from "./pages/appconfigs/appconfigs";
import appConfigsHtml from "./pages/appconfigs/appconfigs.html";

import appConfig from "./pages/appconfig/appconfig";
import appConfigHtml from "./pages/appconfig/appconfig.html";

import configs from "./pages/configs/configs";
import configsHtml from "./pages/configs/configs.html";

import configEditor from "./pages/config/editor";
import configEditorHtml from "./pages/config/editor.html";
import configHistory from "./pages/config/history";
import configHistoryHtml from "./pages/config/history.html";
import configTabset from "./pages/config/tabset";
import configTabsetHtml from "./pages/config/tabset.html";

import templatesList from './pages/templates/list';
import templatesListHtml from './pages/templates/list.html';
import templates from './pages/templates/templates';
import templatesHtml from './pages/templates/templates.html';

import templateGeneral from './pages/template/general';
import templateGeneralHtml from './pages/template/general.html';
import templateEditor from './pages/template/editor';
import templateEditorHtml from './pages/template/editor.html';
import templateHistory from './pages/template/history';
import templateHistoryHtml from './pages/template/history.html';
import templateTabset from './pages/template/tabset';
import templateTabsetHtml from './pages/template/tabset.html';

// WIDGETS
import appVersionCrit from "./widgets/criteria/app_version_criteria";
import appVersionCritHtml from "./widgets/criteria/app_version_criteria.html";
import templateCrit from "./widgets/criteria/template_criteria";
import templateCritHtml from "./widgets/criteria/template_criteria.html";
import checkHtml from "./widgets/form/ui_checkbox.html";
import radioHtml from "./widgets/form/ui_radio.html";
import dateHtml from "./widgets/form/ui_date.html";
import datetimeHtml from "./widgets/form/ui_datetime.html";
import selectHtml from "./widgets/form/ui_select.html";
import textareaHtml from "./widgets/form/ui_textarea.html";
import uploadDetails from "./widgets/upload_details/upload_details";
import uploadDetailsHtml from "./widgets/upload_details/upload_details.html";
import lineEditor from "./widgets/line_editor/line_editor";
import lineEditorHtml from "./widgets/line_editor/line_editor.html";
import sm from "./widgets/shared_module/shared_module";
import smHtml from "./widgets/shared_module/shared_module.html";
import fp from "./widgets/forward_pager/forward_pager";
import fpHtml from "./widgets/forward_pager/forward_pager.html";
import pager from './widgets/pager/pager';
import pagerHtml from './widgets/pager/pager.html';
import tagEditor from "./widgets/tag-editor/tag_editor";
import tagEditorHtml from "./widgets/tag-editor/tag_editor.html";
import uiDur from "./widgets/form/ui_duration";
import uiDurHtml from "./widgets/form/ui_duration.html";
import timestamps from "./widgets/timestamps/timestamps";
import timestampsHtml from "./widgets/timestamps/timestamps.html";
import phone from "./widgets/phone/phone";
import phoneHtml from "./widgets/phone/phone.html";
import inputEditor from "./widgets/input-editor/input_editor";
import inputEditorHtml from "./widgets/input-editor/input_editor.html";

// DIALOGS
import critEditor from "./dialogs/criteria_editor/criteria_editor";
import critEditorHtml from "./dialogs/criteria_editor/criteria_editor.html";
import signOutUser from "./dialogs/sign_out_user/sign_out_user";
import signOutUserHtml from "./dialogs/sign_out_user/sign_out_user.html";
import moduleBrowser from "./dialogs/module_browser/module_browser";
import moduleBrowserHtml from "./dialogs/module_browser/module_browser.html";
import publicKey from "./dialogs/publickey/publickey";
import publicKeyHtml from "./dialogs/publickey/publickey.html";
import jsonEditor from "./dialogs/json_editor/json_editor";
import jsonEditorHtml from "./dialogs/json_editor/json_editor.html";
import reportEditor from "./dialogs/report_editor/report_editor";
import reportEditorHtml from "./dialogs/report_editor/report_editor.html";
import signIn from "./dialogs/sign_in/sign_in";
import signInHtml from "./dialogs/sign_in/sign_in.html";
import enumEditor from "./dialogs/enumeration_editor/enumeration_editor";
import enumEditorHtml from "./dialogs/enumeration_editor/enumeration_editor.html";
import mcEditor from "./dialogs/multichoice_editor/multichoice_editor";
import mcEditorHtml from "./dialogs/multichoice_editor/multichoice_editor.html";
import eventIdEditor from "./dialogs/event_id_editor/event_id_editor";
import eventIdEditorHtml from "./dialogs/event_id_editor/event_id_editor.html";
import timesEditor from "./dialogs/times_editor/times_editor";
import timesEditorHtml from "./dialogs/times_editor/times_editor.html";
import rulesEditor from "./dialogs/rules_editor/rules_editor";
import rulesEditorHtml from "./dialogs/rules_editor/rules_editor.html";
import dateWindowEditor from "./dialogs/date_window_editor/date_window_editor";
import dateWindowEditorHtml from "./dialogs/date_window_editor/date_window_editor.html";
import extIdEditor from "./dialogs/external_id_importer/external_id_importer";
import extIdEditorHtml from "./dialogs/external_id_importer/external_id_importer.html";
import partExport from "./dialogs/participant_export/participant_export";
import partExportHtml from "./dialogs/participant_export/participant_export.html";
import copySchemas from "./dialogs/copy_schemas/copy_schemas";
import copySchemasHtml from "./dialogs/copy_schemas/copy_schemas.html";
import withdrawal from "./dialogs/withdrawal/withdrawal";
import withdrawalHtml from "./dialogs/withdrawal/withdrawal.html";
import sendNot from "./dialogs/send_notification/send_notification";
import sendNotHtml from "./dialogs/send_notification/send_notification.html";
// import sendSms from "./dialogs/send_sms_message/send_sms_message";
// import sendSmsHtml from "./dialogs/send_sms_message/send_sms_message.html";
import settings from "./dialogs/settings/settings";
import settingsHtml from "./dialogs/settings/settings.html";
import selectSchemas from "./dialogs/select_schemas/select_schemas";
import selectSchemasHtml from "./dialogs/select_schemas/select_schemas.html";
import selectSurveys from "./dialogs/select_surveys/select_surveys";
import selectSurveysHtml from "./dialogs/select_surveys/select_surveys.html";
import selectConfigs from "./dialogs/select_configs/select_configs";
import selectConfigsHtml from "./dialogs/select_configs/select_configs.html";
import selectAssessments from "./dialogs/select_assessments/select_assessments";
import selectAssessmentsHtml from "./dialogs/select_assessments/select_assessments.html";
import selectFiles from "./dialogs/select_files/select_files";
import selectFilesHtml from "./dialogs/select_files/select_files.html";
import previewAppConfig from "./dialogs/preview_appconfig/preview_appconfig";
import previewAppConfigHtml from "./dialogs/preview_appconfig/preview_appconfig.html";
import editAppleLink from "./dialogs/edit_apple_link/edit_apple_link";
import editAppleLinkHtml from "./dialogs/edit_apple_link/edit_apple_link.html";
import editAndroidLink from "./dialogs/edit_android_link/edit_android_link";
import editAndroidLinkHtml from "./dialogs/edit_android_link/edit_android_link.html";
import oauthProvider from "./dialogs/oauth_provider/oauth_provider";
import oauthProviderHtml from "./dialogs/oauth_provider/oauth_provider.html";
import fileUpload from "./dialogs/file_upload/file_upload";
import fileUploadHtml from "./dialogs/file_upload/file_upload.html";
import addOrgMember from "./dialogs/add_org_member/add_org_member";
import addOrgMemberHtml from "./dialogs/add_org_member/add_org_member.html";
import addEnrollment from "./dialogs/add_enrollment/add_enrollment";
import addEnrollmentHtml from "./dialogs/add_enrollment/add_enrollment.html";
import addSponsor from "./dialogs/add_sponsor/add_sponsor";
import addSponsorHtml from "./dialogs/add_sponsor/add_sponsor.html";
import addSponsoredStudy from "./dialogs/add_sponsored_study/add_sponsored_study";
import addSponsoredStudyHtml from "./dialogs/add_sponsored_study/add_sponsored_study.html";
import updateIdentifiers from './dialogs/update_identifiers/update_identifiers_dialog';
import updateIdentifiersHtml from './dialogs/update_identifiers/update_identifiers_dialog.html';
import sessionEditor from './dialogs/session_editor/session_editor';
import sessionEditorHtml from './dialogs/session_editor/session_editor.html';
import eventEditor from "./dialogs/event_editor/event_editor";
import eventEditorHtml from "./dialogs/event_editor/event_editor.html";

import nfHtml from "./pages/not_found/not_found.html";

const reg = ko.components.register;
reg("errors", {viewModel: errors, template: errorsHtml});
reg("none", {template: '<div class="ui modal dialog"></div>'});
reg("assessments", {viewModel: assessments, template: assessmentsHtml});
reg("assessment_general", {viewModel: assessment, template: assessmentHtml});
reg("assessment_ui", {viewModel: assessmentUi, template: assessmentUiHtml});
reg("assessment_config", {viewModel: assessmentConfig, template: assessmentConfigHtml});
reg("assessment_template", {viewModel: assessmentTemplate, template: assessmentTemplateHtml});
reg("assessment_history", {viewModel: assessmentHistory, template: assessmentHistoryHtml});
reg("assessment_resources", {viewModel: assessmentResources, template: assessmentResourcesHtml});
reg("assessment_resource", {viewModel: assessmentResource, template: assessmentResourceHtml});
reg("assessment_customize", {viewModel: assessmentCustomize, template: assessmentCustomizeHtml});
reg("assessment-tabset", {viewModel: assessmentTabs, template: assessmentTabsHtml});
reg("sharedassessments", 
  {viewModel: sharedassessments, template: sharedassessmentsHtml});
reg("sharedassessment_general", 
  {viewModel: sharedassessment, template: sharedassessmentHtml});
reg("sharedassessment_ui", 
  {viewModel: sharedassessmentUi, template: sharedassessmentUiHtml});
reg("sharedassessment_history", 
  {viewModel: sharedassessmentHistory, template: sharedassessmentHistoryHtml});
reg("sharedassessment_config", 
  {viewModel: sharedassessmentConfig, template: sharedassessmentConfigHtml});
reg("sharedassessment_resources", 
  {viewModel: sharedassessmentResources, template: sharedassessmentResourcesHtml});
reg("sharedassessment_resource", 
  {viewModel: sharedassessmentResource, template: sharedassessmentResourceHtml});
reg("sharedassessment-tabset", 
  {viewModel: sharedassessmentTabs, template: sharedassessmentTabsHtml});
reg("tags", {viewModel: tags, template: tagsHtml});
reg("dailyUploads", {viewModel: dailyUploads, template: dailyUploadsHtml});
reg("retention", {viewModel: retention, template: retentionHtml});
reg("studyreports-tabset", {viewModel: studyReportsTabset, template: studyReportsTabsetHtml});
reg("general", {viewModel: general, template: generalHtml});
reg("email", {viewModel: email, template: emailHtml});
reg("app_links", {viewModel: applinks, template: applinksHtml});
reg("password_policy", {viewModel: passwordPolicy, template: passwordPolicyHtml});
reg("oauth_providers", {viewModel: oauthProviders, template: oauthProvidersHtml});
reg("install_links", {viewModel: installLinks, template: installLinksHtml});
reg("advanced", {viewModel: advanced, template: advancedHtml});
reg("externalIds", {viewModel: externalIds, template: externalIdsHtml});
reg("signUps", {viewModel: signUps, template: signUpsHtml});
reg("reports", {viewModel: reports, template: reportsHtml});
reg("report", {viewModel: report, template: reportHtml});
reg("subpopulations", {viewModel: subpops, template: subpopsHtml});
reg("subpopulation", {viewModel: subpop, template: subpopHtml});
reg("subpopulation_editor", {viewModel: subpopEditor, template: subpopEditorHtml});
reg("subpopulation_history", {viewModel: subpopHistory, template: subpopHistoryHtml});
reg("subpopulation_download", {viewModel: subpopDl, template: subpopDlHtml});
reg("surveys", {viewModel: surveys, template: surveysHtml});
reg("survey", {viewModel: survey, template: surveyHtml});
reg("survey_versions", {viewModel: surveyVers, template: surveyVersHtml});
reg("survey_schema", {viewModel: surveySchema, template: surveySchemaHtml});
reg("schemas", {viewModel: schemas, template: schemasHtml});
reg("schema", {viewModel: schema, template: schemaHtml});
reg("schema_versions", {viewModel: schemaVers, template: schemaVersHtml});
reg("export_settings", {viewModel: exportSettings, template: exportSettingsHtml});
reg("shared_upload_metadata", {viewModel: uploadMetadata, template: uploadMetadataHtml});
reg("scheduleplans", {viewModel: scheduleplans, template: scheduleplansHtml});
reg("scheduleplan", {viewModel: scheduleplan, template: scheduleplanHtml});
reg("participants", {viewModel: participants, template: participantsHtml});
reg("participant_general", {viewModel: partGeneral, template: partGeneralHtml});
reg("participant_activities", {viewModel: partActivities, template: partActivitiesHtml});
reg("participant_activity_events", {viewModel: partEvents, template: partEventsHtml});
reg("participant_activity", {viewModel: partActivity, template: partActivityHtml});
reg("participant_clientData", {viewModel: partClientData, template: partClientDataHtml});
reg("participant_enrollments", {viewModel: partEnrollments, template: partEnrollmentsHtml});
reg("participant_consents", {viewModel: partConsents, template: partConsentsHtml});
reg("participant_reports", {viewModel: partReports, template: partReportsHtml});
reg("participant_notifications", {viewModel: partNots, template: partNotsHtml});
reg("participant_report", {viewModel: partReport, template: partReportHtml});
reg("participant_uploads", {viewModel: partUploads, template: partUploadsHtml});
reg("participant_upload", {viewModel: partUpload, template: partUploadHtml});
reg("participant_request_info", {viewModel: partRequestInfo, template: partRequestInfoHtml});
reg("upload-details", {viewModel: uploadDetails, template: uploadDetailsHtml});
reg("custom_events", {viewModel: customEvents, template: customEventsHtml});
reg("auto_custom_events", {viewModel: autoCustomEvents, template: autoCustomEventsHtml});
reg("topics", {viewModel: topics, template: topicsHtml});
reg("topic", {viewModel: topic, template: topicHtml});
reg("files", {viewModel: files, template: filesHtml});
reg("file", {viewModel: file, template: fileHtml});
reg("schedule", {viewModel: schedule, template: scheduleHtml});
reg("uploads", {viewModel: uploads, template: uploadsHtml});
reg("upload", {viewModel: upload, template: uploadHtml});
//reg("masterschedules", {viewModel: adminMasterSchedules, template: adminMasterSchedulesHtml});
reg("SimpleScheduleStrategy", {viewModel: ss, template: ssHtml});
reg("ABTestScheduleStrategy", {viewModel: abs, template: absHtml});
reg("CriteriaScheduleStrategy", {viewModel: cs, template: csHtml});
reg("ABTestScheduleStrategyPanel", {viewModel: absPanel, template: absPanelHtml});
reg("CriteriaScheduleStrategyPanel", {viewModel: csPanel, template: csPanelHtml});
reg("SimpleScheduleStrategyPanel", {viewModel: ssPanel, template: ssPanelHtml});
reg("SurveyPanel", {viewModel: surveyPanel, template: surveyPanelHtml});
reg("admin_cache", {viewModel: adminCache, template: adminCacheHtml});
reg("admin_apps", {viewModel: adminApps, template: adminAppsHtml});
reg("admin_app", {viewModel: adminApp, template: adminAppHtml});
reg("organizations", {viewModel: orgs, template: orgsHtml})
reg("orgEditor", {viewModel: orgEditor, template: orgEditorHtml})
reg("orgMembers", {viewModel: orgMembers, template: orgMembersHtml})
reg("orgStudies", {viewModel: orgStudies, template: orgStudiesHtml})
reg("org-tabset", {viewModel: orgTabset, template: orgTabsetHtml});
reg("memGeneral", {viewModel: memGeneral, template: memGeneralHtml});
reg("memClientData", {viewModel: memClientData, template: memClientDataHtml});
reg("memRequestInfo", {viewModel: memRequestInfo, template: memRequestInfoHtml});
reg("mem-tabset", {viewModel: memTabset, template: memTabsetHtml});
reg("mem-breadcrumb", {viewModel: memBreadcrumb, template: memBreadcrumbHtml});
reg("studies", {viewModel: studies, template: studiesHtml});
reg("studyEditor", {viewModel: studyEditor, template: studyEditorHtml});
reg("study-contact", {viewModel: studyContact, template: studyContactHtml});
reg("studyUi", {viewModel: studyUi, template: studyUiHtml});
reg("studySponsors", {viewModel: studySponsors, template: studySponsorsHtml});
reg("studyEnrollments", {viewModel: studyEnrollments, template: studyEnrollmentsHtml});
reg("studyClientData", {viewModel: studyClientData, template: studyClientDataHtml});
reg("studyParticipants", {viewModel: studyparticipants, template: studyparticipantsHtml});
reg("study-tabset", {viewModel: studyTabset, template: studyTabsetHtml});
reg("studyparticipant_general", {viewModel: studypartGeneral, template: studypartGeneralHtml});
reg("studyparticipant_enrollments", {viewModel: studypartEnrollments, template: studypartEnrollmentsHtml});
reg("studyparticipant_schedule", {viewModel: studypartSchedule, template: studypartScheduleHtml});
reg("studyparticipant_timeline", {viewModel: studypartTimeline, template: studypartTimelineHtml});
reg("studyparticipant_adherence", {viewModel: studypartAdherence, template: studypartAdherenceHtml});
reg("studyparticipant_adherencesearch", {viewModel: studypartAdherenceSearch, template: studypartAdherenceSearchHtml});
reg("studyparticipant_history", {viewModel: studypartHistory, template: studypartHistoryHtml});
reg("studyparticipant-tabset", {viewModel: studypartTabset, template: studypartTabsetHtml});
reg("studyparticipant_uploads", {viewModel: studypartUploads, template: studypartUploadsHtml});
reg("studyparticipant_upload", {viewModel: studypartUpload, template: studypartUploadHtml});
reg("studyparticipant_notifications", {viewModel: studypartNots, template: studypartNotsHtml});
reg("studyparticipant_reports", {viewModel: studypartReports, template: studypartReportsHtml});
reg("studyparticipant_report", {viewModel: studypartReport, template: studypartReportHtml});
reg("studyparticipant_clientData", {viewModel: studypartClientData, template: studypartClientDataHtml});
reg("studyparticipant_request_info", {viewModel: studypartRequestInfo, template: studypartRequestInfoHtml});
reg("studyparticipant_consents", {viewModel: studypartConsents, template: studypartConsentsHtml});

reg("schedules2", {viewModel: schedules2, template: schedules2Html});
reg("schedule2", {viewModel: schedule2, template: schedule2Html});
reg("session", {viewModel: session, template: sessionHtml});
reg("time-window", {viewModel: timeWindow, template: timeWindowHtml});
reg("assessment-ref", {viewModel: assessmentRef, template: assessmentRefHtml});
reg("message", {viewModel: messageRef, template: messageRefHtml});
reg("notification", {viewModel: notification, template: notificationHtml});
reg("localized-label", {viewModel: label, template: labelHtml});
reg("preview_timeline", {viewModel: previewTimeline, template: previewTimelineHtml, synchronous: true});

reg("BooleanConstraints", {viewModel: boolConst, template: boolConstHtml});
reg("DateConstraints", {viewModel: dateConst, template:  dateConstHtml});
reg("DateTimeConstraints", {viewModel: dateTimeConst, template: dateTimeConstHtml});
reg("YearMonthConstraints", {viewModel: yearMonthConst, template: yearMonthConstHtml});
reg("YearConstraints", {viewModel: yearConst, template: yearConstHtml});
reg("PostalCodeConstraints", {viewModel: postalConst, template: postalConstHtml});
reg("DurationConstraints", {viewModel: durationConst, template: durationConstHtml});
reg("TimeConstraints", {viewModel: timeConst, template: timeConstHtml});
reg("IntegerConstraints", {viewModel: intConst, template: intConstHtml});
reg("DecimalConstraints", {viewModel: decConst, template: decConstHtml});
reg("StringConstraints", {viewModel: strConst, template: strConstHtml});
reg("MultiValueConstraints", {viewModel: mvConst, template: mvConstHtml});
reg("WeightConstraints", {viewModel: weightConst, template: weightConstHtml});
reg("HeightConstraints", {viewModel: heightConst, template: heightConstHtml});
reg("BloodPressureConstraints", {viewModel: bpConst, template: bpConstHtml});
reg("tag-editor", {viewModel: tagEditor, template: tagEditorHtml});
reg("ui-duration", {viewModel: uiDur, template: uiDurHtml});
reg("events-tabset", {template: eventsTabsetHtml});
reg("survey-tabset", {viewModel: surveyTabset, template: surveyTabsetHtml});
reg("subpop-tabset", {viewModel: subpopTabset, template: subpopTabsetHtml});
reg("line-editor", {viewModel: lineEditor, template: lineEditorHtml});
reg("app_version_criteria", {viewModel: appVersionCrit, template: appVersionCritHtml});
reg("template_criteria", {viewModel: templateCrit, template: templateCritHtml});
reg("participants-pager", {viewModel: partPager, template: partPagerHtml});
reg("studyparticipants-pager", {viewModel: studypartPager, template: studypartPagerHtml});
reg("field_definition", {viewModel: fieldDef, template: fieldDefHtml});
reg("SurveyInfoScreen", {viewModel: infoScreen, template: infoScreenHtml});
reg("SurveyQuestion", {template: questionHtml});
reg("constraints-label", {template: constLabelHtml});
reg("ui-rules", {viewModel: rules, template: rulesHtml});
reg("ui-checkbox", {template: checkHtml});
reg("ui-radio", {template: radioHtml});
reg("ui-date", {template: dateHtml});
reg("ui-datetime", {template: datetimeHtml});
reg("ui-select", {template: selectHtml});
reg("ui-textarea", {template: textareaHtml});
/* reg('fire-event', {template: require('./widgets/fire_event.html') }); */
reg("settings-tabset", {viewModel: settingsTabset, template: settingsTabsetHtml});
reg("participant-tabset", {viewModel: partTabset, template: partTabsetHtml});
reg("schema-tabset", {viewModel: schemaTabset, template: schemaTabsetHtml});
reg("verified-icon", {viewModel: verifiedIcon, template: verifiedIconHtml});
reg("not_found", {template: nfHtml });
reg("shared-module", {viewModel: sm, template: smHtml});
reg("forward-pager", {viewModel: fp, template: fpHtml});
reg("templatesList", {viewModel: templatesList, template: templatesListHtml});
reg("templates", {viewModel: templates, template: templatesHtml});
reg("template_general", {viewModel: templateGeneral, template: templateGeneralHtml});
reg("template_editor", {viewModel: templateEditor, template: templateEditorHtml});
reg("template_history", {viewModel: templateHistory, template: templateHistoryHtml});
reg("template-tabset", {viewModel: templateTabset, template: templateTabsetHtml});
reg("pager", {viewModel: pager, template: pagerHtml});
reg("timestamps", {viewModel: timestamps, template: timestampsHtml});
reg("phone", {viewModel: phone, template: phoneHtml});
reg("input-editor", {viewModel: inputEditor, template: inputEditorHtml})

// Dialogs. These must be synchronous.
reg("sign_out_user", {viewModel: signOutUser, template: signOutUserHtml, synchronous: true});
reg("module_browser", {viewModel: moduleBrowser, template: moduleBrowserHtml, synchronous: true});
reg("publickey", {viewModel: publicKey, template: publicKeyHtml, synchronous: true});
reg("json_editor", {viewModel: jsonEditor, template: jsonEditorHtml, synchronous: true});
reg("report_editor", {viewModel: reportEditor, template: reportEditorHtml, synchronous: true});
reg("sign_in_dialog", {viewModel: signIn, template: signInHtml, synchronous: true});
reg("enumeration_editor", {viewModel: enumEditor, template: enumEditorHtml, synchronous: true});
reg("multichoice_editor", {viewModel: mcEditor, template: mcEditorHtml, synchronous: true});
reg("event_id_editor", {viewModel: eventIdEditor, template: eventIdEditorHtml, synchronous: true});
reg("event_editor", {viewModel: eventEditor, template: eventEditorHtml, synchronous: true});
reg("times_editor", {viewModel: timesEditor, template: timesEditorHtml, synchronous: true});
reg("rules_editor", {viewModel: rulesEditor, template: rulesEditorHtml, synchronous: true});
reg("date_window_editor", {viewModel: dateWindowEditor, template: dateWindowEditorHtml, synchronous: true});
reg("external_id_importer", {viewModel: extIdEditor, template: extIdEditorHtml, synchronous: true});
reg("participant_export", {viewModel: partExport, template: partExportHtml, synchronous: true});
reg("copy_schemas", {viewModel: copySchemas, template: copySchemasHtml, synchronous: true});
reg("withdrawal", {viewModel: withdrawal, template: withdrawalHtml, synchronous: true});
reg("send_notification", {viewModel: sendNot, template: sendNotHtml, synchronous: true});
// reg("send_sms_message", {viewModel: sendSms, template: sendSmsHtml, synchronous: true});
reg("settings", {viewModel: settings, template: settingsHtml, synchronous: true});
reg("select_schemas", {viewModel: selectSchemas, template: selectSchemasHtml, synchronous: true});
reg("select_surveys", {viewModel: selectSurveys, template: selectSurveysHtml, synchronous: true});
reg("select_configs", {viewModel: selectConfigs, template: selectConfigsHtml, synchronous: true});
reg("select_assessments", {viewModel: selectAssessments, template: selectAssessmentsHtml, synchronous: true});
reg("select_assessment_refs", {viewModel: selectAssessmentRefs, template: selectAssessmentRefsHtml, synchronous: true});
reg("select_files", {viewModel: selectFiles, template: selectFilesHtml, synchronous: true});
reg("preview_appconfig", {viewModel: previewAppConfig, template: previewAppConfigHtml, synchronous: true});
reg("edit_apple_link", {viewModel: editAppleLink, template: editAppleLinkHtml, synchronous: true});
reg("edit_android_link", {viewModel: editAndroidLink, template: editAndroidLinkHtml, synchronous: true});
reg("file_upload", {viewModel: fileUpload, template: fileUploadHtml, synchronous: true});
reg("add_org_member", {viewModel: addOrgMember, template: addOrgMemberHtml, synchronous: true});
reg("add_enrollment", {viewModel: addEnrollment, template: addEnrollmentHtml, synchronous: true});
reg("add_sponsor", {viewModel: addSponsor, template: addSponsorHtml, synchronous: true});
reg("add_sponsored_study", {viewModel: addSponsoredStudy, template: addSponsoredStudyHtml, synchronous: true});
reg("oauth_provider", {viewModel: oauthProvider, template: oauthProviderHtml, synchronous: true});
reg("appconfigs", {viewModel: appConfigs, template: appConfigsHtml});
reg("appconfig", {viewModel: appConfig, template: appConfigHtml});
reg("configs", {viewModel: configs, template: configsHtml});
reg("config_editor", {viewModel: configEditor, template: configEditorHtml});
reg("config_history", {viewModel: configHistory, template: configHistoryHtml});
reg("config-tabset", {viewModel: configTabset, template: configTabsetHtml});
reg("criteria_editor", {viewModel: critEditor, template: critEditorHtml, synchronous: true});
reg("update_identifiers_dialog", {viewModel: updateIdentifiers, template: updateIdentifiersHtml, synchronous: true});
reg("session_editor", {viewModel: sessionEditor, template: sessionEditorHtml, synchronous: true});
// Attribute editors
reg("user_attributes", {template: userAtts, viewModel: setEditor("userProfileAttributes")});
reg("task_identifiers", {template: taskIdentifiers, viewModel: setEditor("taskIdentifiers")});
reg("data_groups", {template: dataGroups, viewModel: setEditor("dataGroups")});
reg("empty", {viewModel: function(){}, template: "<span></span>"});
