export const TIME_ZONES = [
  "America/Anchorage",
  "America/Boise",
  "America/Chicago",
  "America/Denver",
  "America/Detroit",
  "America/Indiana/Knox",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Tell_City",
  "America/Indiana/Vevay",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Indianapolis",
  "America/Kentucky/Monticello",
  "America/Los_Angeles",
  "America/Louisville",
  "America/Nassau",
  "America/New_York",
  "America/North_Dakota/Beulah",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/Phoenix",
  "America/Puerto_Rico",
  "Greenwich",
  "Europe/London",
  "Europe/Paris",
  "Europe/Istanbul",
  "Europe/Ulyanovsk",
  "Asia/Kolkata"
];

export default {
  templateTitles: {
    'email_account_exists':'Account already exists notification (email)',
    'email_app_install_link':'Link to install app (email)',
    'email_reset_password':'Reset password (email)',
    'email_sign_in':'Sign in (via email)',
    'email_signed_consent':'Consent agreement (email)',
    'email_verify_email':'Verify email address',
    'sms_account_exists':'Account already exists notification (SMS)',
    'sms_app_install_link':'Link to install app (SMS)',
    'sms_phone_sign_in':'Sign in (via SMS)',
    'sms_reset_password':'Reset password (SMS)',
    'sms_signed_consent':'Consent agreement (SMS)',
    'sms_verify_phone':'Verify phone number'
  },
  canBeEditedBy: {
    'superadmin': ['Administrator', 'Developer', 'Organization Administrator', 'Researcher', 'Study Coordinator', 'Study Designer', 'Worker'],
    'admin': ['Developer', "Organization Administrator", 'Researcher', 'Study Coordinator', 'Study Designer', 'Superadmin'],
    'org_admin': ['Study Coordinator', 'Study Designer', 'Organization Administrator'],
    'researcher': ['Developer'],
    'study_coordinator': [],
    'study_designer': [],
    'developer': [],
    'worker': []
  },
  environments: [
    { value: "local", label: "Local" },
    { value: "develop", label: "Development" },
    { value: "staging", label: "Staging" },
    { value: "production", label: "Production" }
  ],
  host: {
    local: "http://localhost:9000",
    develop: "https://ws-develop.sagebridge.org",
    staging: "https://ws-staging.sagebridge.org",
    production: "https://ws.sagebridge.org"
  },
  synapseOauthClients: {
    local: {
      vendor: 'bsm-local',
      clientId: '100008',
      signIn: 'https://signin.dev.sagebase.org/?'

    },
    staging: {
      vendor: 'bsm-staging',
      clientId: '100007',
      signIn: 'https://signin.dev.sagebase.org/?'
    },
    production: {
      vendor: 'synapse',
      clientId: '100018',
      signIn: 'https://signin.synapse.org/?'
    },
    "local-prod": {
      vendor: 'bsm-local',
      clientId: '100019',
      signIn: 'https://signin.synapse.org/?'

    },
    "staging-prod": {
      vendor: 'bsm-staging',
      clientId: '100020',
      signIn: 'https://signin.synapse.org/?'
    },
    "production-prod": {
      vendor: 'synapse',
      clientId: '100018',
      signIn: 'https://signin.synapse.org/?'
    }
  },
  assessmentPropTypes: [
    {label: 'String', value: 'string'},
    {label: 'Boolean', value: 'boolean'},
    {label: 'Number', value: 'number'}
  ],
  toastr: {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: "toast-bottom-center",
    preventDuplicates: true,
    /*
    showDuration: "300",
    hideDuration: 300,
    timeOut: 7000,
    extendedTimeOut: "1000",
    */
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
    opacity: 1.0
  },
  msgs: {
    shared_modules: {
      PUBLISH: "Are you sure you want to publish this shared module version?"
    },
    UNDO_SPONSOR: "Are you sure? This changes permissions, though you can redo this later."
  },
  phasesOpts: [
    {label: 'Legacy', value: 'legacy'},
    {label: 'Design', value: 'design'},
    {label: 'Recruitment', value: 'recruitment'},
    {label: 'In Flight', value: 'in_flight'},
    {label: 'Analysis', value: 'analysis'},
    {label: 'Completed', value: 'completed'},
    {label: 'Withdrawn', value: 'withdrawn'},
  ],
  retentionReports: ['api', 'biomarin-pku-study', 'crf-module', 'sage-mpower-2'],
  accounts: "/v1/accounts",
  adminAuth: "/v3/auth/admin",
  appConfigs: "/v3/appconfigs",
  appConfigElements: "/v3/appconfigs/elements",
  apps: "/v1/apps",
  assessments: '/v1/assessments',
  cache: "/v3/cache",
  compoundactivitydefinitions: "/v3/compoundactivitydefinitions",
  emailStatus: "/v1/apps/self/emailStatus",
  export: "/v3/export",
  externalIds: "/v4/externalids",
  files: "/v3/files",
  getCurrentApp: "/v1/apps/self",
  getApp: "/v1/apps/",
  getAppList: "/v1/apps",
  getAppPublicKey: "/v1/apps/self/publicKey",
  masterschedule: "/v3/schedulerconfigs",
  metadata: "/v3/sharedmodules/metadata",
  oauthSignIn: "/v3/auth/oauth/signIn",
  organizations: "/v1/organizations",
  participants: "/v3/participants",
  phoneSignIn: "/v3/auth/phone/signIn",
  reauth: "/v3/auth/reauth",
  reports: "/v3/reports",
  requestPhoneSignIn: "/v3/auth/phone",
  requestResetPassword: "/v3/auth/requestResetPassword",
  schedules: "/v5/schedules",
  schemaPlans: "/v3/scheduleplans",
  schemas: "/v3/uploadschemas",
  schemasV4: "/v4/uploadschemas",
  sharedassessments: "/v1/sharedassessments",
  sharedmodules: "/v3/sharedmodules",
  signIn: "/v3/auth/signIn",
  signOut: "/v3/auth/signOut",
  studies: "/v5/studies",
  subpopulations: "/v3/subpopulations",
  survey: "/v3/surveys",
  surveys: "/v3/surveys",
  templates: "/v3/templates",
  topics: "/v3/topics",
  uploads: "/v3/uploads",
  uploadstatuses: "/v3/uploadstatuses",
  users: "/v3/users",
  verifyEmail: "/v1/apps/self/verifyEmail",
  verifyAppEmail: "/v1/apps/self/emails/resendVerify"
};
