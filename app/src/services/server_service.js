/**
 * Manages the session and calls to the server. The two are closely bound since the former represents
 * the ability to do the latter.
 *
 * If a call is made to the server before a session exists, a one-time listener is registered to wait
 * for a session to be established, then the call is completed.
 */
// Necessary because export of library is broken
var EventEmitter = require('../events');
var storeService = require('./store_service');
var config = require('../config');
var utils = require("../utils");
var Promise = require('es6-promise').Promise;

var SESSION_KEY = 'session';
var SESSION_STARTED_EVENT_KEY = 'sessionStarted';
var SESSION_ENDED_EVENT_KEY = 'sessionEnded';
var listeners = new EventEmitter();
var session = null;

if (typeof window !== "undefined") { // jQuery throws up if there's no window, even in unit tests.
    $(function() {
        session = storeService.get(SESSION_KEY);
        if (session && session.environment) {
            listeners.emit(SESSION_STARTED_EVENT_KEY, session);
        } else {
            session = null;
            listeners.emit(SESSION_ENDED_EVENT_KEY);
        }
    });
}

var cache = (function() {
    var cachedItems = {};
    return {
        get: function(key) {
            var value = cachedItems[key];
            console.info((value) ? "[json cache] hit" : "[json cache] miss",key);
            return value;
        },
        set: function(key, response) {
            console.info("[json cache] caching",key);
            cachedItems[key] = response;
        },
        clear: function(key) {
            // Clear all paths that are logically higher in the endpoint namespace,
            // e.g. /foo/123 will delete /foo if it is cached, as this would be the
            // collection that might include /foo/123
            Object.keys(cachedItems).forEach(function(aKey) {
                if (key.indexOf(aKey) === 0 || aKey.indexOf(key) === 0) {
                    console.info("[json cache] deleting",aKey);
                    delete cachedItems[aKey];
                }
                ['/published','/recent'].forEach(function(extension) {
                    if (cachedItems[aKey+extension]) {
                        console.info("[json cache] deleting",aKey+extension);
                        delete cachedItems[aKey+extension];
                    }
                });
            });
        },
        reset: function() {
            cachedItems = {};
        }
    };
})();

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
    //var dataString = data.replace(/"password":"([^"]*)"/, '"password":"[REDACTED]"');
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
            //console.error(response.status, response.responseJSON);
        } else {
            //console.error("Significant server failure", response);
        }
    });
    return promise;
}
function get(path) {
    if (cache.get(path)) {
        return Promise.resolve(cache.get(path));
    } else {
        return makeSessionWaitingPromise(function() {
            return getInt(config.host[session.environment] + path).then(function(response) {
                cache.set(path, response);
                return response;
            });
        });
    }
}
function post(path, body) {
    cache.clear(path);
    return makeSessionWaitingPromise(function() {
        return postInt(config.host[session.environment] + path, body);
    });
}
function del(path) {
    cache.clear(path);
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
    cache.reset();
    var env = session.environment;
    session = null;
    // We want to clear persistence, but keep these between sign-ins.
    var studyKey = storeService.get('studyKey');
    var envName = storeService.get('environment');
    storeService.removeAll();
    storeService.set('studyKey', studyKey);
    storeService.set('environment', envName);

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
                storeService.set(SESSION_KEY, session);
                listeners.emit(SESSION_STARTED_EVENT_KEY, sess);
            }
            return sess;
        });
        return request;
    },
    getStudyList: function(env) {
        var request = Promise.resolve(getInt(config.host[env] + config.getStudyList));
        request.then(function(response) {
            return response.items.sort(utils.makeFieldSorter("name"));
        });
        return request;
    },
    signOut: signOut,
    requestResetPassword: function(env, data) {
        return Promise.resolve(postInt(config.host[env] + config.requestResetPassword, data));
    },
    getStudy: function() {
        return get(config.getStudy);
    },
    getStudyPublicKey: function() {
        return get(config.getStudyPublicKey);
    },
    saveStudy: function(study) {
        return post(config.getStudy, study);
    },

    getMostRecentStudyConsent: function(guid) {
        return get(config.subpopulations + "/" + guid + "/consents/recent");
    },
    getStudyConsent: function(guid, createdOn) {
        return get(config.subpopulations + "/" + guid + "/consents/" + new Date(createdOn).toISOString());
    },
    saveStudyConsent: function(guid, consent) {
        return post(config.subpopulations + "/" + guid + "/consents", consent);
    },
    publishStudyConsent: function(guid, createdOn) {
        return post(config.subpopulations + "/" + guid + "/consents/" + new Date(createdOn).toISOString() + "/publish");
    },
    getConsentHistory: function(guid) {
        return get(config.subpopulations + "/" + guid + "/consents");
    },
    emailRoster: function() {
        return post(config.emailRoster);
    },
    getSurveys: function() {
        return get(config.surveys);
    },
    getPublishedSurveys: function() {
        return get(config.publishedSurveys);
    },
    getSurveyAllRevisions: function(guid) {
        return get(config.survey + guid + '/revisions');
    },
    getSurvey: function(guid, createdOn) {
        var createdString = new Date(createdOn).toISOString();
        var url = config.survey+guid+'/revisions/'+createdString;

        return get(url);
    },
    getSurveyMostRecent: function(guid) {
        return get(config.survey + guid + '/revisions/recent');
    },
    createSurvey: function(survey) {
        return post(config.surveys, survey);
    },
    publishSurvey: function(guid, createdOn) {
        var createdString = new Date(createdOn).toISOString();
        var url = config.survey + guid + '/revisions/' + createdString + '/publish';
        return post(url);
    },
    versionSurvey: function(guid, createdOn) {
        var createdString = new Date(createdOn).toISOString();
        var url = config.survey + guid + '/revisions/' + createdString + '/version';
        return post(url);
    },
    updateSurvey: function(survey) {
        var createdString = new Date(survey.createdOn).toISOString();
        var url = config.survey + survey.guid + '/revisions/' + createdString;
        return post(url, survey);
    },
    deleteSurvey: function(survey) {
        var createdString = new Date(survey.createdOn).toISOString();
        var url = config.survey + survey.guid + '/revisions/' + createdString;
        return del(url);
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
        return get(config.schemaPlans);
    },
    getSchedulePlan: function(guid) {
        return get(config.schemaPlans + "/" + guid);
    },
    saveSchedulePlan: function(plan) {
        if (plan.guid) {
            return post(config.schemaPlans + "/" + plan.guid, plan);
        } else {
            return post(config.schemaPlans, plan);
        }
    },
    deleteSchedulePlan: function(guid) {
        return del(config.schemaPlans + "/" + guid);
    },
    getAllSubpopulations: function() {
        return get(config.subpopulations);
    },
    getSubpopulation: function(guid) {
        return get(config.subpopulations + "/" + guid);
    },
    createSubpopulation: function(subpop) {
        return post(config.subpopulations, subpop);
    },
    updateSubpopulation: function(subpop) {
        return post(config.subpopulations + "/" + subpop.guid, subpop);
    },
    deleteSubpopulation: function(guid) {
        return del(config.subpopulations + "/" + guid);
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