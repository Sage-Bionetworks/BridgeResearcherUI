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
    signIn: '/v3/auth/signIn',
    signOut: '/v3/auth/signOut',
    getStudy: '/v3/studies/self',
    getStudyList: '/v3/studies?format=summary',
    activeStudyConsent: '/v3/consents/published',
    mostRecentStudyConsent: '/v3/consents/recent',
    studyConsents: '/v3/consents',
    studyConsent: '/v3/consents/',
    sendRoster: '/v3/users/emailParticipantRoster',
    requestResetPassword: '/v3/auth/requestResetPassword'
};
