/**
 * Manages the session and calls to the server. The two are closely bound since the former represents
 * the ability to do the latter.
 *
 * If a call is made to the server before a session exists, a one-time listener is registered to wait
 * for a session to be established, then the call is completed.
 *
 * Right now when you sign out, and then sign back in, the system doesn't update the UI. So if you
 * sign in to a different study or environment, nothing changes until you click around.
 */
// Necessary because export of library is broken
var EventEmitter = require('../events');
var optionsService = require('../services/options_service');
var config = require('../config');
var $ = require('jquery');
var Promise = require('es6-promise').Promise;

var SESSION_KEY = 'session';
var SESSION_STARTED_EVENT_KEY = 'sessionStarted';
var SESSION_ENDED_EVENT_KEY = 'sessionEnded';
var listeners = new EventEmitter();
var session = null;

$(function() {
    session = optionsService.get(SESSION_KEY, null);
    if (session && session.environment) {
        listeners.emit(SESSION_STARTED_EVENT_KEY, session);
    } else {
        session = null;
        listeners.emit(SESSION_ENDED_EVENT_KEY);
    }
});

function getHeaders() {
    var headers = {'Content-Type': 'application/json'};
    if (session && session.sessionToken) {
        headers['Bridge-Session'] = session.sessionToken;
    }
    return headers;
}
function postInt(url, data) {
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
function getInt(url) {
    console.debug("GET", url);
    return $.ajax({
        method: 'GET',
        url: url,
        headers: getHeaders(),
        type: "application/json",
        dataType: "json"
    });
}
function deleteInt(url) {
    console.debug("DELETE", url);
    return $.ajax({
        method: 'DELETE',
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
            listeners.once(SESSION_STARTED_EVENT_KEY, executor);
        }
    });
    promise.catch(function(response) {
        if (response.status === 401) {
            signOut();
        } else if (response.responseJSON) {
            console.error(response.status, response.responseJSON);
        } else {
            console.error("Significant server failure", response);
        }
    });
    return promise;
}
function get(path) {
    return makeSessionWaitingPromise(function() {
        return getInt(config.host[session.environment] + path);
    });
}
function post(path, body) {
    return makeSessionWaitingPromise(function() {
        return postInt(config.host[session.environment] + path, body);
    });
}
function del(path) {
    return makeSessionWaitingPromise(function() {
        return deleteInt(config.host[session.environment] + path);
    });
}

/**
 * If we ever get back a 401, the UI isn't in sync with reality, sign the
 * user out. So this is called from error handler, as well as being available
 * from serverService.
 * @returns {Promise}
 */
function signOut() {
    var env = session.environment;
    session = null;
    optionsService.remove(SESSION_KEY);
    listeners.emit(SESSION_ENDED_EVENT_KEY);
    return new Promise(function(resolve, reject) {
        var p = postInt(config.host[env] + config.signOut);
        p.then(resolve);
        p.fail(reject);
    });
}

module.exports = {
    isAuthenticated: function() {
        return (session !== null);
    },
    signIn: function(studyName, env, data) {
        var request = Promise.resolve(postInt(config.host[env] + config.signIn, data));
        request.then(function(sess) {
            sess.studyName = studyName;
            session = sess;
            optionsService.set(SESSION_KEY, sess);
            listeners.emit(SESSION_STARTED_EVENT_KEY, session);
            console.log(sess);
        });
        return request;
    },
    getStudyList: function(env) {
        return Promise.resolve(getInt(config.host[env] + config.getStudyList));
    },
    signOut: signOut,
    requestResetPassword: function(env, data) {
        return Promise.resolve(postInt(config.host[env] + config.requestResetPassword, data));
    },
    getStudy: function() {
        return get(config.getStudy);
    },
    saveStudy: function(study) {
        return post(config.getStudy, study);
    },
    getActiveStudyConsent: function() {
        return get(config.activeStudyConsent);
    },
    getMostRecentStudyConsent: function() {
        return get(config.mostRecentStudyConsent);
    },
    getStudyConsent: function(createdOn) {
        return get(config.studyConsent + new Date(createdOn).toISOString());
    },
    saveStudyConsent: function(consent) {
        return post(config.studyConsents, consent);
    },
    publishStudyConsent: function(createdOn) {
        return post(config.studyConsent + new Date(createdOn).toISOString() + "/publish");
    },
    getConsentHistory: function() {
        return get(config.studyConsents);
    },
    emailRoster: function() {
        return post(config.emailRoster);
    },
    getSurveys: function() {
        return get(config.surveys);
    },
    getSurveyAllRevisions: function(guid) {
        return get(config.survey + guid + '/revisions');
    },
    getSurvey: function(guid, createdOn) {
        return get(config.survey + guid + '/revisions/' + new Date(createdOn).toISOString());
    },
    getSurveyMostRecent: function(guid) {
        return get(config.survey + guid + '/revisions/recent');
    },
    getSurveyMostRecentlyPublished: function(guid) {
        return get(config.survey + guid + '/revisions/published');
    },
    createSurvey: function(survey) {
        return post(config.surveys, survey);
    },
    publishSurvey: function(guid, createdOn) {
        return post(config.survey + guid + '/revisions/' + new Date(createdOn).toISOString() + '/publish');
    },
    versionSurvey: function(guid, createdOn) {
        return post(config.survey + guid + '/revisions/' + new Date(createdOn).toISOString() + '/version');
    },
    updateSurvey: function(survey) {
        return post(config.survey + survey.guid + '/revisions/' + new Date(survey.createdOn).toISOString(), survey);
    },
    deleteSurvey: function(survey) {
        return del(config.survey + survey.guid + '/revisions/' + new Date(survey.createdOn).toISOString());
    },
    getAllUploadSchemas: function() {
        return get(config.schemas);
    },
    getMostRecentUploadSchema: function(identifier) {
        return get(config.schemas + "/" + identifier + '/recent');
    },
    getUploadSchemaAllRevisions: function(identifier) {
        return get(config.schemas + "/" + identifier);
    },
    getUploadSchema: function(identifier, revision) {
        return get(config.schemas + "/" + identifier + "/revisions/" + revision);
    },
    updateUploadSchema: function(schema) {
        return post(config.schemas, schema);
    },
    deleteSchemaRevision: function(schema) {
        return del(config.schemas + "/" + schema.schemaId + "/revisions/" + schema.revision);
    },
    addSessionStartListener: function(listener) {
        if (typeof listener !== "function") {
            throw Error("Session listener not a function");
        }
        listeners.addEventListener(SESSION_STARTED_EVENT_KEY, listener);
    },
    addSessionEndListener: function(listener) {
        if (typeof listener !== "function") {
            throw Error("Session listener not a function");
        }
        listeners.addEventListener(SESSION_ENDED_EVENT_KEY, listener);
    }
};