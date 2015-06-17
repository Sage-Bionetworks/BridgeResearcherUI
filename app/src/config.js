module.exports = config = {
    studies: [
        {value: "api", label: "API"},
        {value: "asthma", label: "Asthma Health"},
        {value: "diabetes", label: "GlucoSuccess"},
        {value: "parkinson", label: "mPower"},
        {value: "cardiovascular", label: "My Heart Counts"},
        {value: "breastcancer", label: "Share The Journey"}
    ],
    host: {
        'local': 'http://localhost:9000',
        'develop': 'https://webservices-develop.sagebridge.org',
        'staging': 'https://webservices-staging.sagebridge.org',
        'production': 'https://webservices.sagebridge.org'
    },
    signIn: '/api/v1/auth/signIn',
    signOut: '/api/v1/auth/signOut',
    get_study: '/researcher/v1/study',
    active_study_consent: '/researcher/v1/consents/active',
    study_consent_history: '/researcher/v1/consents',
    study_consent: '/researcher/v1/consents/',
    send_roster: '/researcher/v1/study/participants'
};
