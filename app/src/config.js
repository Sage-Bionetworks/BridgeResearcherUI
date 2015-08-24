module.exports = config = {
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
    signIn: '/v3/auth/signIn',
    signOut: '/v3/auth/signOut',
    getStudy: '/v3/studies/self',
    getStudyList: '/v3/studies?format=summary',
    activeStudyConsent: '/v3/consents/published',
    mostRecentStudyConsent: '/v3/consents/recent',
    studyConsents: '/v3/consents',
    studyConsent: '/v3/consents/',
    emailRoster: '/v3/users/emailParticipantRoster',
    requestResetPassword: '/v3/auth/requestResetPassword',
    surveys: '/v3/surveys',
    survey: '/v3/surveys/'
};
