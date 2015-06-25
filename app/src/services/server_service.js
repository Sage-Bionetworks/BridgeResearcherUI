/**
 * Manages the session and calls to the server. The two are closely bound since the former represents
 * the ability to do the latter.
 *
 * If a call is made to the server before a session exists, a one-time listener is registered to wait
 * for a session to be established, then the call is completed.
 */
var EventEmitter = require('events');
var optionsService = require('../services/options_service');
var config = require('../config');
var $ = require('jquery');

var SESSION_KEY = 'session';
var SESSION_STARTED_EVENT_KEY = 'sessionStarted';
var SESSION_ENDED_EVENT_KEY = 'sessionEnded';
var session = null;
var events = new EventEmitter();

$(function() {
    session = optionsService.get(SESSION_KEY, null);
    if (session && session.environment) {
        events.emit(SESSION_STARTED_EVENT_KEY, session);
    } else {
        session = null;
        events.emit(SESSION_ENDED_EVENT_KEY);
    }
});

function getHeaders() {
    var headers = {'Content-Type': 'application/json'};
    if (session && session.sessionToken) {
        headers['Bridge-Session'] = session.sessionToken;
    }
    return headers;
}
function post(url, data) {
    if (!data) {
        data = "{}";
    } else if (typeof data !== 'string') {
        data = JSON.stringify(data);
    }
    var dataString = data.replace(/"password":"([^"]*)"/, '"password":"[REDACTED]"');
    console.debug("POST", url, dataString);

    return $.ajax({
        method: 'POST',
        url: url,
        headers: getHeaders(),
        data: data,
        type: "application/json",
        dataType: "json"
    });
}
function get(url) {
    console.debug("GET", url);
    return $.ajax({
        method: 'GET',
        url: url,
        headers: getHeaders(),
        type: "application/json",
        dataType: "json"
    });
}
function makeSessionWaitingPromise(func) {
    var promise = new Promise(function(resolve, reject) {
        // 3rd law of JavaScript... when in doubt use another function
        var executor = function() {
            var p = func();
            p.then(resolve);
            p.fail(reject);
        };
        if (session) {
            executor();
        } else {
            events.once(SESSION_STARTED_EVENT_KEY, executor);
        }
    });
    promise.catch(function(response) {
        if (response.responseJSON) {
            console.error(response.status, response.responseJSON);
        } else {
            console.error("Significant server failure", response);
        }
    });
    return promise;
}

module.exports = {
    isAuthenticated: function() {
        return (session !== null);
    },
    signIn: function(env, data) {
        var request = Promise.resolve(post(config.host[env] + config.signIn, data));
        request.then(function(sess) {
            console.log(sess);
            sess.environment = env;
            session = sess;
            optionsService.set(SESSION_KEY, sess);
            events.emit(SESSION_STARTED_EVENT_KEY, session);
        });
        return request;
    },
    signOut: function() {
        // Need to sign out whether the server throws an error or not.
        var env = session.environment;
        session = null;
        optionsService.remove(SESSION_KEY);
        events.emit(SESSION_ENDED_EVENT_KEY);

        var f = function(resolve, reject) {
            var p = get(config.host[env] + config.signOut);
            p.then(resolve);
            p.fail(reject);
        };
        return new Promise(f);
    },
    requestResetPassword: function(env, data) {
        return Promise.resolve(post(config.host[env] + config.request_reset_password, data));
    },
    getStudy: function() {
        return makeSessionWaitingPromise(function() {
            return get(config.host[session.environment] + config.get_study);
        });
    },
    saveStudy: function(study) {
        return makeSessionWaitingPromise(function() {
            return post(config.host[session.environment] + config.get_study, study);
        });
    },
    getActiveStudyConsent: function() {
        return makeSessionWaitingPromise(function() {
            return get(config.host[session.environment] + config.active_study_consent);
        });
    },
    getStudyConsent: function(createdOn) {
        return makeSessionWaitingPromise(function() {
            return get(config.host[session.environment] + config.study_consent + new Date(createdOn).toISOString());
        });
    },
    saveStudyConsent: function(consent) {
        return makeSessionWaitingPromise(function() {
            return post(config.host[session.environment] + config.study_consents, consent);
        });
    },
    publishStudyConsent: function(createdOn) {
        return makeSessionWaitingPromise(function() {
            return post(config.host[session.environment] + config.publish_study_consent + new Date(createdOn).toISOString());
        });
    },
    getConsentHistory: function() {
        return makeSessionWaitingPromise(function() {
            return get(config.host[session.environment] + config.study_consent_history);
        });
    },
    sendRoster: function() {
        return makeSessionWaitingPromise(function() {
            return post(config.host[session.environment] + config.send_roster);
        });
    },
    addSessionStartListener: function(listener) {
        events.addListener(SESSION_STARTED_EVENT_KEY, listener);
    },
    addSessionEndListener: function(listener) {
        events.addListener(SESSION_ENDED_EVENT_KEY, listener);
    }
};