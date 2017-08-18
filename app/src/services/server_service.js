/**
 * Manages the session and calls to the server. The two are closely bound since the former represents
 * the ability to do the latter.
 *
 * If a call is made to the server before a session exists, a one-time listener is registered to wait
 * for a session to be established, then the call is completed.
 */
// Necessary because export of library is broken
import $ from 'jquery';
import config from '../config';
import EventEmitter from '../events';
import fn from '../functions';
import Promise from 'bluebird';
import storeService from './store_service';

const SESSION_KEY = 'session';
const SESSION_STARTED_EVENT_KEY = 'sessionStarted';
const SESSION_ENDED_EVENT_KEY = 'sessionEnded';
const listeners = new EventEmitter();
const LOG_CACHE = false;
const NO_CACHE_PATHS = ['studies/self/emailStatus','/participants','externalIds?'];

var session = null;

// jQuery throws up if there's no window, even in unit tests
if (typeof window !== "undefined") {
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

function matchesNoCachePath(path) {
    return NO_CACHE_PATHS.some(function(matchPath) {
        return path.indexOf(matchPath) > -1;
    });
}

var cache = (function() {
    var cachedItems = {};
    return {
        get: function(key) {
            var value = cachedItems[key];
            if (LOG_CACHE) { console.info((value) ? "[json cache] hit" : "[json cache] miss", key); }
            return (value) ? JSON.parse(value) : null;
        },
        set: function(key, response) {
            if (!matchesNoCachePath(key)) {
                if (LOG_CACHE) { console.info("[json cache] caching", key); }
                cachedItems[key] = JSON.stringify(response);
            } else {
                if (LOG_CACHE) { console.warn("[json cache] do not cache", key); }
            }
        },
        clear: function(key) {
            // clear everything, this is now a fetch cache. Very simple, hard to screw up.
            cachedItems = {};
        },
        reset: function() {
            cachedItems = {};
        }
    };
})();

function postInt(url, data) {
    if (!data) {
        data = "{}";
    } else if (typeof data !== 'string') {
        data = JSON.stringify(data);
    }
    return $.ajax(baseParams('POST', url, data));
}
function getInt(url) {
    return $.ajax(baseParams('GET', url));
}
function deleteInt(url) {
    return $.ajax(baseParams('DELETE', url));
}
function baseParams(method, url, data) {
    var headers = {'Content-Type': 'application/json'};
    if (session && session.sessionToken) {
        headers['Bridge-Session'] = session.sessionToken;
    }
    return Object.assign((data) ? {data:data} : {}, {
        method: method,
        url: url,
        headers: headers, 
        type: "application/json", 
        dataType: "json", 
        timeout: 10000
    });
}

function reloadPageWhenSessionLost(response) {
    if (response.status === 401) {
        storeService.remove(SESSION_KEY);
        window.location.reload();
    }
    return response;
}
function makeSessionWaitingPromise(httpAction, func) {
    if (session && session.sessionToken) {
        return func().catch(reloadPageWhenSessionLost);
    }
    console.info("[queuing]", httpAction);
    return new Promise(function(resolve, reject) {
        listeners.once(SESSION_STARTED_EVENT_KEY, resolve);
    }).then(func).catch(reloadPageWhenSessionLost);
}
function get(path) {
    if (cache.get(path)) {
        return Promise.resolve(cache.get(path));
    } else {
        return makeSessionWaitingPromise("GET " + path, function() {
            return getInt(session.host + path).then(function(response) {
                cache.set(path, response);
                return response;
            });
        });
    }
}
function post(path, body) {
    cache.clear(path);
    return makeSessionWaitingPromise("POST " + path, function() {
        return postInt(session.host + path, body);
    });
}
function del(path) {
    cache.clear(path);
    return makeSessionWaitingPromise("DEL " + path, function() {
        return deleteInt(session.host + path);
    });
}
/**
 * If we ever get back a 401, the UI isn't in sync with reality, sign the
 * user out. So this is called from error handler, as well as being available
 * from serverService.
 * @returns {Promise}
 */
function signOut() {
    postInt(session.host + config.signOut);
    cache.reset();
    session = null;
    storeService.remove(SESSION_KEY);
    listeners.emit(SESSION_ENDED_EVENT_KEY);
}
function isSupportedUser() {
    return this.roles.some(function(role) {
        return ["developer","researcher","admin"].indexOf(role) > -1;
    });
}
function cacheParticipantName(response) {
    if (response && response.id) {
        var name = fn.formatName(response);
        cache.set(response.id+':name', {
            name: name,
            externalId: response.externalId,
            status: response.status
        });
    }
    return response;
}
function esc(string) {
    return encodeURIComponent(string);
}

export default {
    isAuthenticated: function() {
        return (session !== null);
    },
    signIn: function(studyName, env, data) {
        return postInt(config.host[env] + config.signIn, data)
            .then(function(sess) {
                sess.isSupportedUser = isSupportedUser;
                if (!sess.isSupportedUser()) {
                    return Promise.reject(new Error("User does not have required roles to use study manager."));
                }
                // in some installations the server environment is "wrong" in that it's not enough 
                // to determine the host. Set a host property and use that for future requests.
                sess.studyName = studyName;
                sess.studyId = data.study;
                session = sess;
                session.host = config.host[env];
                storeService.set(SESSION_KEY, session);
                listeners.emit(SESSION_STARTED_EVENT_KEY, sess);
                return sess;
            });
    },
    getStudyList: function(env) {
        // TODO: why is there a Promise.resolve() here?
        return Promise.resolve(getInt(config.host[env] + config.getStudyList))
            .then(fn.handleSort('items', 'name'));
    },
    signOut: signOut,
    requestResetPassword: function(env, data) {
        // TODO: why is there a Promise.resolve() heree?
        return Promise.resolve(postInt(config.host[env] + config.requestResetPassword, data));
    },
    getStudy: function() {
        return get(config.getCurrentStudy);
    },
    getStudyPublicKey: function() {
        return get(config.getStudyPublicKey);
    },
    saveStudy: function(study, isAdmin) {
        var url = (isAdmin) ? (config.getStudy + study.identifier) : config.getCurrentStudy;
        return post(url, study).then(function(response) {
            study.version = response.version;
            return response;
        });
    },
    createSynapseProject: function(synapseUserId) {
        return post(config.getCurrentStudy + "/synapseProject", [synapseUserId]);
    },
    getMostRecentStudyConsent: function(guid) {
        return get(config.subpopulations + "/" + guid + "/consents/recent");
    },
    getStudyConsent: function(guid, createdOn) {
        return get(config.subpopulations + "/" + guid + "/consents/" + createdOn);
    },
    saveStudyConsent: function(guid, consent) {
        return post(config.subpopulations + "/" + guid + "/consents", consent);
    },
    publishStudyConsent: function(guid, createdOn) {
        return post(config.subpopulations + "/" + guid + "/consents/" + createdOn + "/publish");
    },
    getConsentHistory: function(guid) {
        return get(config.subpopulations + "/" + guid + "/consents");
    },
    emailRoster: function() {
        return post(config.users + '/emailParticipantRoster');
    },
    getSurveys: function() {
        return get(config.surveys);
    },
    getPublishedSurveys: function() {
        return get(config.publishedSurveys);
    },
    getMostRecentlyPublishedSurvey: function(guid) {
        return get(config.survey + guid + '/revisions/published');
    },
    getSurveyAllRevisions: function(guid) {
        return get(config.survey + guid + '/revisions');
    },
    getSurvey: function(guid, createdOn) {
        return get(config.survey+guid+'/revisions/'+createdOn);
    },
    getSurveyMostRecent: function(guid) {
        return get(config.survey + guid + '/revisions/recent');
    },
    createSurvey: function(survey) {
        return post(config.surveys, survey);
    },
    publishSurvey: function(guid, createdOn) {
        return post(config.survey + guid + '/revisions/' + createdOn + '/publish');
    },
    versionSurvey: function(guid, createdOn) {
        return post(config.survey + guid + '/revisions/' + createdOn + '/version');
    },
    updateSurvey: function(survey) {
        var createdString = new Date(survey.createdOn).toISOString();
        var url = config.survey + survey.guid + '/revisions/' + createdString;
        return post(url, survey);
    },
    deleteSurvey: function(survey, physical) {
        var queryString = fn.queryString({physical:(physical === true)});
        var createdString = new Date(survey.createdOn).toISOString();
        var url = config.survey + survey.guid + '/revisions/' + createdString + queryString;
        return del(url);
    },
    getAllUploadSchemas: function() {
        return get(config.schemas).then(function(response) {
            response.items = response.items.filter(function(schema) {
                return (!schema.surveyGuid && !schema.surveyRevision);
            });
            return response;
        });
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
    createUploadSchema: function(schema) {
        return post(config.schemasV4, schema).then(function(response) {
            schema.version = response.version;
            return response;
        });
    },
    updateUploadSchema: function(schema) {
        var path = config.schemasV4+"/"+esc(schema.schemaId)+"/revisions/"+esc(schema.revision);
        return post(path, schema).then(function(response) {
            schema.version = response.version;
            return response;
        });
    },
    deleteSchema: function(schemaId) {
        return del(config.getStudy+session.studyId+"/uploadschemas/"+schemaId);
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
    createSchedulePlan: function(plan) {
        return post(config.schemaPlans, plan).then(function(newPlan) {
            plan.guid = newPlan.guid;
            plan.version = newPlan.version;
            return newPlan;
        });
    },
    saveSchedulePlan: function(plan) {
        var path = (plan.guid) ? 
            (config.schemaPlans + "/" + plan.guid) :
            config.schemaPlans;
        return post(path, plan).then(function(newPlan) {
            plan.guid = newPlan.guid;
            plan.version = newPlan.version;
            return newPlan;
        });
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
        var path = config.subpopulations + "/" + subpop.guid;
        return post(path, subpop).then(function(response) {
            subpop.version = response.version;
            return response;
        });
    },
    deleteSubpopulation: function(guid) {
        return del(config.subpopulations + "/" + guid);
    },
    verifyEmail: function() {
        return post(config.verifyEmail);
    },
    emailStatus: function() {
        return get(config.emailStatus);
    },
    getCacheKeys: function() {
        return get(config.cache);
    },
    deleteCacheKey: function(cacheKey) {
        return del(config.cache+"/"+esc(cacheKey));
    },
    getParticipants: function(offsetBy, pageSize, emailFilter, startTime, endTime) {
        var queryString = fn.queryString({
            offsetBy: offsetBy, pageSize: pageSize, emailFilter: emailFilter,
            startTime: startTime, endTime: endTime
        });
        return get(config.participants+queryString);
    },
    getParticipant: function(id) {
        return get(config.participants+"/"+id).then(cacheParticipantName);
    },
    getParticipantName: function(id) {
        var name = cache.get(id+':name');
        if (name) {
            return Promise.resolve(name);
        } else {
            return get(config.participants+"/"+id).then(cacheParticipantName)
                .then(function() {
                    return Promise.resolve(cache.get(id+':name'));
                });
        }
    },
    getParticipantRequestInfo: function(id) {
        return get(config.participants+"/"+id+"/requestInfo");
    },
    getParticipantNotifications: function(id) {
        return get(config.participants+"/"+id+"/notifications");
    },
    sendUserNotification: function(id, message) {
        return post(config.participants+"/"+id+"/sendNotification", message);
    },
    sendTopicNotification: function(guid, message) {
        return post(config.topics+"/"+guid+"/sendNotification", message);
    },
    createParticipant: function(participant) {
        return post(config.participants+"?verifyEmail=false", participant);
    },
    updateParticipant: function(participant) {
        cache.clear(participant.id+':name');
        return post(config.participants+"/"+participant.id, participant);
    },
    deleteParticipant: function(id) {
        cache.clear(id+':name');
        return del(config.users + '/' + id);
    },
    signOutUser: function(id) {
        return post(config.participants+"/"+id+"/signOut");  
    },
    requestResetPasswordUser: function(id) {
        return post(config.participants+"/"+id+"/requestResetPassword");
    },
    resendConsentAgreement: function(id, subpopGuid) {
        return post(config.participants+"/"+id+"/consents/" + subpopGuid + "/resendConsent");
    },  
    resendEmailVerification: function(id) {
        return post(config.participants+"/"+id+"/resendEmailVerification");
    },
    getExternalIds: function(params) {
        return get(config.externalIds + fn.queryString(params || {}));
    },
    addExternalIds: function(identifiers) {
        return post(config.externalIds, identifiers);
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
    getStudyReports: function() {
        return get(config.reports+fn.queryString({"type":"study"}));
    },
    getStudyReport: function(identifier, startDate, endDate) {
        var queryString = fn.queryString({startDate: startDate, endDate: endDate});
        return get(config.reports + "/" + identifier + queryString);
    },
    addStudyReport: function(identifier, report) {
        return post(config.reports + "/" + identifier, report);
    },
    deleteStudyReport: function(identifier) {
        return del(config.reports + "/" + identifier);
    },
    deleteStudyReportRecord: function(identifier, date) {
        return del(config.reports + "/" + identifier + '/' + date);
    },
    getStudyReportIndex: function(identifier) {
        return get(config.reports + "/" + identifier + "/index");
    },
    updateStudyReportIndex: function(index) {
        return post(config.reports + "/" + index.identifier + "/index", index);
    },
    getParticipantReports: function() {
        return get(config.reports+ fn.queryString({"type":"participant"}));
    },
    getParticipantUploads: function(userId, args) {
        var queryString = fn.queryString(args);
        return get(config.participants + '/' + userId + '/uploads' + queryString);
    },
    getParticipantUploadStatus: function(uploadId) {
        return get(config.uploadstatuses + '/' + uploadId);
    },
    getParticipantReport: function(userId, identifier, startDate, endDate) {
        var queryString = fn.queryString({startDate: startDate, endDate: endDate});
        return get(config.participants + '/' + userId + '/reports/' + identifier + queryString);
    },
    addParticipantReport: function(userId, identifier, report) {
        return post(config.participants + '/' + userId + '/reports/' + identifier, report);
    },
    deleteParticipantReport: function(identifier, userId) {
        return del(config.participants + '/' + userId + '/reports/' + identifier);
    },
    deleteParticipantReportRecord: function(userId, identifier, date) {
        return del(config.participants + '/' + userId + '/reports/' + identifier + '/' + date);
    },
    getParticipantActivities: function(userId, activityGuid, params) {
        var queryString = fn.queryString(params);
        return get(config.participants + '/' + userId + '/activities/' + activityGuid + queryString);
    },
    deleteParticipantActivities: function(userId) {
        return del(config.participants + '/' + userId + '/activities');
    },
    withdrawParticipantFromStudy: function(userId, reason) {
        return post(config.participants + '/' + userId + '/consents/withdraw', reason);
    },
    withdrawParticipantFromSubpopulation: function(userId, subpopGuid, reason) {
        return post(config.participants + '/' + userId + '/consents/' + subpopGuid + '/withdraw', reason);
    },
    getAllTopics: function() {
        return get(config.topics);
    },
    getTopic: function(guid) {
        return get(config.topics + "/" + guid);
    },
    createTopic: function(topic) {
        return post(config.topics, topic);
    },
    updateTopic: function(topic) {
        return post(config.topics + "/" + topic.guid, topic);
    },
    deleteTopic: function(guid) {
        return del(config.topics + "/" + guid);
    },
    getTaskDefinitions: function() {
        return get(config.compoundactivitydefinitions);
    },
    createTaskDefinition: function(task) {
        return post(config.compoundactivitydefinitions, task);
    },
    getTaskDefinition: function(taskId) {
        return get(config.compoundactivitydefinitions + "/" + esc(taskId));
    },
    updateTaskDefinition: function(task) {
        return post(config.compoundactivitydefinitions + "/" + esc(task.taskId), task);
    },
    deleteTaskDefinition: function(taskId) {
        return del(config.compoundactivitydefinitions + "/" + esc(taskId));
    },
    getMetadata: function(searchString, modType) {
        searchString = searchString || "";
        // mostrecent: "true", published: "false", where: null, tags: null
        return get(config.metadata + searchString).then(function(response) {
            if (modType === "survey" || modType === "schema") {
                response.items = response.items.filter(function(item) {
                    return item.moduleType === modType;
                });
            }
            return response;
        });
    },
    createMetadata: function(metadata) {
        return post(config.metadata, metadata);
    },
    getMetadataLatestVersion: function(id) {
        return get(config.metadata + '/' + esc(id));
    },
    getMetadataVersion: function(id, version) {
        return get(config.metadata + '/' + esc(id) + '/versions/' + esc(version));
    },
    getMetadataAllVersions: function(id) {
        // id, mostrecent: "true", published: "false", where: null, tags: null
        return get(config.metadata+'/'+esc(id)+'/versions?mostrecent=false');
    },
    updateMetadata: function(metadata) {
        return post(config.metadata+'/'+esc(metadata.id)+'/versions/'+esc(metadata.version), metadata);
    },
    deleteMetadata: function(id) {
        return del(config.metadata+'/'+esc(id)+'/versions');
    },
    deleteMetadataVersion: function(id, version) {
        return del(config.metadata+'/'+esc(id)+'/versions/'+esc(version));
    },
    importMetadata: function(id, version) {
        var url = (typeof version === "number") ?
            (config.sharedmodules+'/'+esc(id)+'/versions/'+esc(version)+'/import') :
            (config.sharedmodules+'/'+esc(id)+'/import');
        return post(url);
    },
    startExport: function() {
        return post(config.export + "/start");
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