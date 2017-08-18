export default {
    environments: [
        {value: "local", label: "Local"},
        {value: "develop", label: "Development"},
        {value: "staging", label: "Staging"},
        {value: "production", label: "Production"},
        {value: "develop_aws", label: "Development (AWS)"},
        {value: "staging_aws", label: "Staging (AWS)"},
        {value: "production_aws", label: "Production (AWS)"}
    ],
    host: {
        'local': 'http://localhost:9000',
        'develop': 'https://webservices-develop.sagebridge.org',
        'develop_aws': 'https://bridgepf-develop.sagebridge.org',
        'staging': 'https://webservices-staging.sagebridge.org',
        'staging_aws': 'https://bridgepf-uat.sagebridge.org',
        'production': 'https://webservices.sagebridge.org',
        'production_aws': 'https://bridgepf-prod.sagebridge.org',
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
    // options: isPublic, codesEnumerated, codeRequired, notificationsEnabled, under studyId
    studies: {
    },
    cache: '/v3/cache',
    compoundactivitydefinitions: '/v3/compoundactivitydefinitions',
    emailStatus: '/v3/studies/self/emailStatus',
    export: '/v3/export',
    externalIds: '/v3/externalIds',
    getCurrentStudy: '/v3/studies/self',
    getStudy: '/v3/studies/',
    getStudyList: '/v3/studies?format=summary',
    getStudyPublicKey: '/v3/studies/self/publicKey',
    metadata: '/v3/sharedmodules/metadata',
    participants: '/v3/participants',
    publishedSurveys: '/v3/surveys/published',
    reports: '/v3/reports',
    requestResetPassword: '/v3/auth/requestResetPassword',
    schemaPlans: '/v3/scheduleplans',
    schemas: '/v3/uploadschemas',
    schemasV4: '/v4/uploadschemas',
    sharedmodules: '/v3/sharedmodules',
    signIn: '/v3/auth/signIn',
    signOut: '/v3/auth/signOut',
    subpopulations: '/v3/subpopulations',
    survey: '/v3/surveys/',
    surveys: '/v3/surveys',
    topics: '/v3/topics',
    uploadstatuses: '/v3/uploadstatuses',
    users: '/v3/users',
    verifyEmail: '/v3/studies/self/verifyEmail'
};
