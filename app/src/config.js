var sessionService = require('./services/session_service');

module.exports = config = {
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
