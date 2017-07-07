export default {
    environments: [
        {value: "local", label: "Local"},
        {value: "develop", label: "Development"},
        {value: "staging", label: "Staging"},
        {value: "production", label: "Production"},
        {value: "develop_aws", label: "Development (AWS)"},
        {value: "staging_aws", label: "Staging (AWS)"}
    ],
    host: {
        'local': 'http://localhost:9000',
        'develop': 'https://webservices-develop.sagebridge.org',
        'develop_aws': 'https://dev.sagebridge.org',
        'staging': 'https://webservices-staging.sagebridge.org',
        'staging_aws': 'https://uat.sagebridge.org',
        'production': 'https://webservices.sagebridge.org'
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
    signIn: '/v3/auth/signIn',
    signOut: '/v3/auth/signOut',
    getStudy: '/v3/studies/',
    getCurrentStudy: '/v3/studies/self',
    getStudyPublicKey: '/v3/studies/self/publicKey',
    getStudyList: '/v3/studies?format=summary',
    users: '/v3/users',
    requestResetPassword: '/v3/auth/requestResetPassword',
    surveys: '/v3/surveys',
    publishedSurveys: '/v3/surveys/published',
    survey: '/v3/surveys/',
    schemas: '/v3/uploadschemas',
    schemasV4: '/v4/uploadschemas',
    schemaPlans: '/v3/scheduleplans',
    subpopulations: '/v3/subpopulations',
    topics: '/v3/topics',
    verifyEmail: '/v3/studies/self/verifyEmail',
    emailStatus: '/v3/studies/self/emailStatus',
    cache: '/v3/cache',
    participants: '/v3/participants',
    externalIds: '/v3/externalIds',
    reports: '/v3/reports',
    uploadstatuses: '/v3/uploadstatuses',
    sharedmodules: '/v3/sharedmodules',
    metadata: '/v3/sharedmodules/metadata',
    compoundactivitydefinitions: '/v3/compoundactivitydefinitions'
};
