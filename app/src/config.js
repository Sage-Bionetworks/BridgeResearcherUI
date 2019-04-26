export default {
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
  toastr: {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: "toast-bottom-center",
    preventDuplicates: true,
    showDuration: "300",
    hideDuration: 300,
    timeOut: 7000,
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
    opacity: 1.0
  },
  msgs: {
    shared_modules: {
      PUBLISH: "Are you sure you want to publish this shared module version?"
    }
  },
  adminAuth: "/v3/auth/admin",
  appConfigs: "/v3/appconfigs",
  appConfigElements: "/v3/appconfigs/elements",
  cache: "/v3/cache",
  compoundactivitydefinitions: "/v3/compoundactivitydefinitions",
  emailStatus: "/v3/studies/self/emailStatus",
  export: "/v3/export",
  externalIds: "/v4/externalids",
  getCurrentStudy: "/v3/studies/self",
  getStudy: "/v3/studies/",
  getStudyList: "/v3/studies?format=summary",
  getStudyPublicKey: "/v3/studies/self/publicKey",
  metadata: "/v3/sharedmodules/metadata",
  participants: "/v3/participants",
  phoneSignIn: "/v3/auth/phone/signIn",
  publishedSurveys: "/v3/surveys/published",
  reauth: "/v3/auth/reauth",
  reports: "/v3/reports",
  requestPhoneSignIn: "/v3/auth/phone",
  requestResetPassword: "/v3/auth/requestResetPassword",
  schemaPlans: "/v3/scheduleplans",
  schemas: "/v3/uploadschemas",
  schemasV4: "/v4/uploadschemas",
  sharedmodules: "/v3/sharedmodules",
  signIn: "/v3/auth/signIn",
  signOut: "/v3/auth/signOut",
  studies: "/v3/studies",
  subpopulations: "/v3/subpopulations",
  substudies: "/v3/substudies",
  survey: "/v3/surveys/",
  surveys: "/v3/surveys",
  topics: "/v3/topics",
  uploads: "/v3/uploads",
  uploadstatuses: "/v3/uploadstatuses",
  users: "/v3/users",
  verifyEmail: "/v3/studies/self/verifyEmail",
  verifyStudyEmail: "/v3/studies/self/emails/resendVerify"
};
