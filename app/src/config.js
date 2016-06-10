module.exports = {
    environments: [
        {value: "local", label: "Local"},
        {value: "develop", label: "Development"},
        {value: "staging", label: "Staging"},
        {value: "production", label: "Production"}
    ],
    host: {
        'local': 'http://localhost:9000',
        'develop': 'https://webservices-develop.sagebridge.org',
        'staging': 'https://webservices-staging.sagebridge.org',
        'production': 'https://webservices.sagebridge.org'
    },
    toastr: {
        positionClass: "toast-top-right",
        hideDuration: 300,
        timeOut: 7000,
        preventDuplicates: true,
        opacity: 1.0
    },
    // options: showParticipants, showLabCodes, showExternalIds 
    studies: {
        'fphs-lab': {
            showParticipants: true
        },
        'parkinson-lux': {
            showExternalIds: true
        }
    },
    signIn: '/v3/auth/signIn',
    signOut: '/v3/auth/signOut',
    getStudy: '/v3/studies/',
    getCurrentStudy: '/v3/studies/self',
    getStudyPublicKey: '/v3/studies/self/publicKey',
    getStudyList: '/v3/studies?format=summary',
    emailRoster: '/v3/users/emailParticipantRoster',
    requestResetPassword: '/v3/auth/requestResetPassword',
    surveys: '/v3/surveys',
    publishedSurveys: '/v3/surveys/published',
    survey: '/v3/surveys/',
    schemas: '/v3/uploadschemas',
    schemasV4: '/v4/uploadschemas',
    schemaPlans: '/v3/scheduleplans',
    subpopulations: '/v3/subpopulations',
    verifyEmail: '/v3/studies/self/verifyEmail',
    emailStatus: '/v3/studies/self/emailStatus',
    cache: '/v3/cache',
    participants: '/v3/participants',
    externalIds: '/v3/externalIds',
    studyReports: '/v3/reports'
};
