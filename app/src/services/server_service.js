/**
 * Manages the session and calls to the server. The two are closely bound since the former represents
 * the ability to do the latter.
 *
 * If a call is made to the server before a session exists, a one-time listener is registered to wait
 * for a session to be established, then the call is completed.
 */
// Necessary because export of library is broken
var EventEmitter = require('../events');
var optionsService = require('../services/options_service');
var config = require('../config');
var utils = require("../utils");
var $ = require('jquery');
var Promise = require('es6-promise').Promise;

var SESSION_KEY = 'session';
var SESSION_STARTED_EVENT_KEY = 'sessionStarted';
var SESSION_ENDED_EVENT_KEY = 'sessionEnded';
var listeners = new EventEmitter();
var session = null;

if (typeof window !== "undefined") { // jQuery throws up if there's no window, even in unit tests.
    $(function() {
        session = optionsService.get(SESSION_KEY);
        if (session && session.environment) {
            listeners.emit(SESSION_STARTED_EVENT_KEY, session);
        } else {
            session = null;
            listeners.emit(SESSION_ENDED_EVENT_KEY);
        }
    });
}

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
    //console.debug("POST", url, dataString);

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
    //console.debug("GET", url);
    return $.ajax({
        method: 'GET',
        url: url,
        headers: getHeaders(),
        type: "application/json",
        dataType: "json"
    });
}
function deleteInt(url) {
    //console.debug("DELETE", url);
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
            console.error("Signed out due to 401");
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
function removeFromCache(key) {
    return function(response) {
        optionsService.remove(key);
        return response;
    };
}
function setCache(key) {
    return function(response) {
        optionsService.set(key, response);
        return response;
    };
}
function getSurveyKey(arg, arg2) {
    if (arguments.length === 2) {
        return arg + ":" + new Date(arg2.toISOString());
    } else {
        return arg.guid + ":" + new Date(arg.createdOn).toISOString();
    }
}
function surveyOption(survey) {
    survey.elements = survey.elements.filter(filterQuestions).map(questionOption(survey));
    return { label: survey.name, value: survey.guid, questions: survey.elements };
}
function filterQuestions(element) {
    return (element.type === "SurveyQuestion");
}
function questionOption(survey) {
    return function(question) {
        var label = survey.name+": "+question.identifier+((question.fireEvent)?" *":"");
        return { label: label, value: question.guid };
    };
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
    // We want to clear persistence, but keep these between sign-ins.
    var studyKey = optionsService.get('studyKey');
    var envName = optionsService.get('environment');
    optionsService.removeAll();
    optionsService.set('studyKey', studyKey);
    optionsService.set('environment', envName);

    listeners.emit(SESSION_ENDED_EVENT_KEY);
    return new Promise(function(resolve, reject) {
        var p = postInt(config.host[env] + config.signOut);
        p.then(resolve);
        p.fail(reject);
    });
}

function isSupportedUser() {
    return (this.roles.indexOf("developer") > -1 || this.roles.indexOf("researcher") > -1);
}

module.exports = {
    isAuthenticated: function() {
        return (session !== null);
    },
    signIn: function(studyName, env, data) {
        var request = Promise.resolve(postInt(config.host[env] + config.signIn, data));
        request.then(function(sess) {
            sess.isSupportedUser = isSupportedUser;
            if (sess.isSupportedUser()) {
                sess.studyName = studyName;
                sess.studyId = data.study;
                session = sess;
                optionsService.set(SESSION_KEY, session);
                listeners.emit(SESSION_STARTED_EVENT_KEY, sess);
            }
            return sess;
        });
        return request;
    },
    getStudyList: function(env) {
        var request = Promise.resolve(getInt(config.host[env] + config.getStudyList));
        request.then(function(response) {
            response.items.sort(utils.makeFieldSorter("name"));
            return response;
        });
        return request;
    },
    signOut: signOut,
    requestResetPassword: function(env, data) {
        return Promise.resolve(postInt(config.host[env] + config.requestResetPassword, data));
    },
    getStudy: function() {
        return optionsService.getPromise('study') || get(config.getStudy).then(setCache('study'));
    },
    getStudyPublicKey: function() {
        return get(config.getStudyPublicKey);
    },
    saveStudy: function(study) {
        return post(config.getStudy, study).then(removeFromCache('study'));
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
        var createdString = new Date(createdOn).toISOString();
        var url = config.survey+guid+'/revisions/'+createdString;
        var key = getSurveyKey(guid, createdOn);

        return optionsService.getPromise(key) || get(url).then(setCache(key));
    },
    getSurveyMostRecent: function(guid) {
        return get(config.survey + guid + '/revisions/recent');
    },
    getSurveysSummarized: function() {
        return get(config.surveys + '?format=summary').then(function(response) {
            response.items.sort(utils.makeFieldSorter("name"));
            return response.items.map(surveyOption);
        });
    },
    createSurvey: function(survey) {
        return post(config.surveys, survey);
    },
    publishSurvey: function(guid, createdOn) {
        var createdString = new Date(createdOn).toISOString();
        var url = config.survey + guid + '/revisions/' + createdString + '/publish';
        return post(url).then(removeFromCache(getSurveyKey(guid, createdOn)));
    },
    versionSurvey: function(guid, createdOn) {
        var createdString = new Date(createdOn).toISOString();
        var url = config.survey + guid + '/revisions/' + createdString + '/version';
        return post(url).then(removeFromCache(getSurveyKey(guid, createdOn)));
    },
    updateSurvey: function(survey) {
        var createdString = new Date(survey.createdOn).toISOString();
        var url = config.survey + survey.guid + '/revisions/' + createdString;
        return post(url, survey).then(removeFromCache(getSurveyKey(survey)));
    },
    deleteSurvey: function(survey) {
        var createdString = new Date(survey.createdOn).toISOString();
        var url = config.survey + survey.guid + '/revisions/' + createdString;
        return del(url).then(removeFromCache(getSurveyKey(survey)));
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
    getSchedulePlans: function() {
        return optionsService.getPromise('scheduleplans') || get(config.schemaPlans).then(setCache('scheduleplans'));
    },
    getSchedulePlan: function(guid) {
        return get(config.schemaPlans + "/" + guid);
    },
    saveSchedulePlan: function(plan) {
        if (plan.guid) {
            return post(config.schemaPlans + "/" + plan.guid, plan).then(removeFromCache('scheduleplans'));
        } else {
            return post(config.schemaPlans, plan).then(removeFromCache('scheduleplans'));
        }
    },
    deleteSchedulePlan: function(guid) {
        return del(config.schemaPlans + "/" + guid).then(removeFromCache('scheduleplans'));
    },
    getSession: function() {
        if (session) {
            return Promise.resolve(session);
        } else {
            return new Promise(function(resolve, reject) {
                listeners.once(SESSION_STARTED_EVENT_KEY, resolve);
            });
        }
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