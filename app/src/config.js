var sessionService = require('./services/session_service');

module.exports = config = {
    studies: [
        {value: "test", label: "Test"},
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
    signIn: function(env) {
        return config.host[env] + '/api/v1/auth/signIn';
    }

};
