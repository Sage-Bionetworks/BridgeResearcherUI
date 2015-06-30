module.exports = config = {
    environments: [
        {value: "local", label: "Local"},
        {value: "develop", label: "Development"},
        {value: "staging", label: "Staging"},
        {value: "production", label: "Production"}
    ],
    /*
    studies: [
        {identifier: "api", name: "API"},
        {identifier: "asthma", name: "Asthma Health"},
        {identifier: "diabetes", name: "GlucoSuccess"},
        {identifier: "parkinson", name: "mPower"},
        {identifier: "cardiovascular", name: "My Heart Counts"},
        {identifier: "breastcancer", name: "Share The Journey"}
    ],
    */
    host: {
        'local': 'http://localhost:9000',
        'develop': 'https://webservices-develop.sagebridge.org',
        'staging': 'https://webservices-staging.sagebridge.org',
        'production': 'https://webservices.sagebridge.org'
    },
    signIn: '/api/v1/auth/signIn',
    signOut: '/api/v1/auth/signOut',
    getStudy: '/researcher/v1/study',
    getStudyInfo: '/researcher/v1/studies',
    activeStudyConsent: '/researcher/v1/consents/active',
    mostRecentStudyConsent: '/researcher/v1/consents/recent',
    studyConsentHistory: '/researcher/v1/consents',
    studyConsents: '/researcher/v1/consents',
    studyConsent: '/researcher/v1/consents/',
    publishStudyConsent: '/researcher/v1/consents/active/',
    sendRoster: '/researcher/v1/study/participants',
    requestResetPassword: '/api/v1/auth/requestResetPassword'
};
