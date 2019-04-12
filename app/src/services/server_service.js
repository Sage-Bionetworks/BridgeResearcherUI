/**
 * Manages the session and calls to the server. The two are closely bound since the former represents
 * the ability to do the latter.
 *
 * If a call is made to the server before a session exists, a one-time listener is registered to wait
 * for a session to be established, then the call is completed.
 */
// Necessary because export of library is broken
import $ from "jquery";
import Cache from "./cache";
import config from "../config";
import EventEmitter from "../events";
import fn from "../functions";
import Promise from "bluebird";
import storeService from "./store_service";

const SESSION_ENDED_EVENT_KEY = "sessionEnded";
const SESSION_KEY = "session";
const SESSION_STARTED_EVENT_KEY = "sessionStarted";

// We want this to be shared by all server service instances.
const cache = new Cache();
const listeners = new EventEmitter();
let session = null;

function esc(string) {
  return encodeURIComponent(string);
}
function postInt(url, data) {
  if (!data) {
    data = "{}";
  } else if (typeof data !== "string") {
    data = JSON.stringify(data);
  }
  return $.ajax(baseParams("POST", url, data));
}
function getInt(url, responseType) {
  return $.ajax(baseParams("GET", url, null, responseType));
}
function deleteInt(url) {
  return $.ajax(baseParams("DELETE", url));
}
function baseParams(method, url, data, responseType) {
  responseType = responseType || "json";
  let headers = { "Content-Type": "application/json" };
  if (session && session.sessionToken) {
    headers["Bridge-Session"] = session.sessionToken;
  }
  return Object.assign(data ? { data: data } : {}, {
    method: method,
    url: url,
    headers: headers,
    type: "application/json",
    dataType: responseType,
    timeout: 10000
  });
}
// Some JSON needs to be displayed exactly as entered and cannot be parsed, because some details
// can be lost (e.g. 62.0 will become 62 after parsing). This method will extract an object under
// a property name and convert it to a string.
function parsePropObjToString(raw, fieldName) {
  var startIndex = raw.indexOf('"' + fieldName + '"') + (fieldName.length + 3);
  if (startIndex === -1) {
    return "";
  }
  raw = raw.substring(startIndex);
  var brackets = 1;
  for (var i = 1; i < raw.length; i++) {
    if (raw.charAt(i) === "{") {
      brackets++;
    } else if (raw.charAt(i) === "}") {
      brackets--;
    }
    if (brackets === 0) {
      return raw.substring(0, i + 1);
    }
  }
  return "";
}
function convertDataToString(textResponse) {
  var data = parsePropObjToString(textResponse, "data");
  var response = JSON.parse(textResponse);
  if (response.healthData && response.healthData.data) {
    response.healthData.data = data;
  }
  return response;
}

export class ServerService {
  constructor(reloadNoAuth = true) {
    this.reloadNoAuth = reloadNoAuth;
    session = storeService.get(SESSION_KEY);
    $(() => {
      if (session && session.environment) {
        listeners.emit(SESSION_STARTED_EVENT_KEY, session);
      } else {
        session = null;
        listeners.emit(SESSION_ENDED_EVENT_KEY);
      }
    });
  }
  reloadPageWhenSessionLost(response) {
    if (response.status === 401) {
      if (this.reloadNoAuth) {
        storeService.remove(SESSION_KEY);
        window.location.reload();
      } else {
        throw response;
      }
    }
    return response;
  }
  makeSessionWaitingPromise(httpAction, func) {
    if (session && session.sessionToken) {
      return func().catch(this.reloadPageWhenSessionLost.bind(this));
    }
    console.info("[queuing]", httpAction);
    return new Promise((resolve, reject) => {
      listeners.once(SESSION_STARTED_EVENT_KEY, resolve);
    })
      .then(func)
      .catch(this.reloadPageWhenSessionLost.bind(this));
  }
  gethttp(path) {
    if (cache.get(path)) {
      return Promise.resolve(cache.get(path));
    } else {
      return this.makeSessionWaitingPromise("GET " + path, () => {
        return getInt(session.host + path).then(response => {
          cache.set(path, response);
          return response;
        });
      });
    }
  }
  gettext(path) {
    if (cache.get(path)) {
      return Promise.resolve(cache.get(path));
    } else {
      return this.makeSessionWaitingPromise("GET " + path, () => {
        return getInt(session.host + path, "text").then(response => {
          cache.set(path, response);
          return response;
        });
      });
    }
  }
  post(path, body) {
    cache.clear(path);
    return this.makeSessionWaitingPromise("POST " + path, () => {
      return postInt(session.host + path, body);
    });
  }
  del(path) {
    cache.clear(path);
    return this.makeSessionWaitingPromise("DEL " + path, () => {
      return deleteInt(session.host + path);
    });
  }
  isSupportedUser() {
    return this.roles.some(function(role) {
      return ["developer", "researcher", "admin"].indexOf(role) > -1;
    });
  }
  cacheParticipantName(response) {
    if (response && response.id) {
      let name = fn.formatNameAsFullLabel(response);
      cache.set(response.id + ":name", { name: name, status: response.status });
    }
    return response;
  }
  cacheSession(studyName, studyId, env) {
    // Initial sign in we capture some information not in the session. Thereafer we have
    // to copy it on reauthentication to any newly acquired session.
    return function(sess) {
      if (studyName) {
        sess.studyName = studyName;
        sess.studyId = studyId;
        sess.host = config.host[env];
        sess.isSupportedUser = this.isSupportedUser;
      } else {
        fn.copyProps(sess, session, "studyName", "studyId", "host", "isSupportedUser");
      }
      session = sess;
      storeService.set(SESSION_KEY, session);
      listeners.emit(SESSION_STARTED_EVENT_KEY, session);
      return session;
    }.bind(this);
  }

  isAuthenticated() {
    return session !== null;
  }
  signIn(studyName, env, signIn) {
    return postInt(config.host[env] + config.signIn, signIn).then(this.cacheSession(studyName, signIn.study, env));
  }
  phoneSignIn(studyName, env, signIn) {
    return postInt(config.host[env] + config.phoneSignIn, signIn).then(this.cacheSession(studyName, signIn.study, env));
  }
  signOut() {
    postInt(session.host + config.signOut);
    cache.reset();
    session = null;
    storeService.remove(SESSION_KEY);
    listeners.emit(SESSION_ENDED_EVENT_KEY);
  }
  reauthenticate() {
    if (!session) {
      console.error("Cannot reauthenticate: session has expired and been removed.");
    }
    let reauth = { study: session.studyId, email: session.email, reauthToken: session.reauthToken };
    return postInt(config.host[session.environment] + config.reauth, reauth).then(this.cacheSession());
  }
  getStudyList(env) {
    return getInt(config.host[env] + config.getStudyList).then(fn.handleSort("items", "name"));
  }
  requestPhoneSignIn(env, data) {
    return postInt(config.host[env] + config.requestPhoneSignIn, data);
  }
  requestResetPassword(env, data) {
    return postInt(config.host[env] + config.requestResetPassword, data);
  }
  getStudy() {
    return this.gethttp(config.getCurrentStudy);
  }
  getStudyById(identifier) {
    return this.gethttp(config.getStudy + identifier);
  }
  createStudy(studyAndUsers) {
    return this.post(config.getStudy + "init", studyAndUsers);
  }
  deleteStudy(identifier) {
    return this.del(config.getStudy + identifier + "?physical=false");
  }
  getStudyPublicKey() {
    return this.gethttp(config.getStudyPublicKey);
  }
  saveStudy(study, isAdmin) {
    let url = isAdmin ? config.getStudy + study.identifier : config.getCurrentStudy;
    return this.post(url, study).then(function(response) {
      study.version = response.version;
      return response;
    });
  }
  createSynapseProject(synapseUserId) {
    return this.post(config.getCurrentStudy + "/synapseProject", [synapseUserId]);
  }
  getMostRecentStudyConsent(guid) {
    return this.gethttp(config.subpopulations + "/" + guid + "/consents/recent");
  }
  getStudyConsent(guid, createdOn) {
    return this.gethttp(config.subpopulations + "/" + guid + "/consents/" + createdOn);
  }
  saveStudyConsent(guid, consent) {
    return this.post(config.subpopulations + "/" + guid + "/consents", consent);
  }
  publishStudyConsent(guid, createdOn) {
    return this.post(config.subpopulations + "/" + guid + "/consents/" + createdOn + "/publish");
  }
  getConsentHistory(guid) {
    return this.gethttp(config.subpopulations + "/" + guid + "/consents");
  }
  emailRoster() {
    return this.post(config.users + "/email ParticipantRoster");
  }
  getSurveys(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.surveys + queryString);
  }
  getPublishedSurveys() {
    return this.gethttp(config.publishedSurveys);
  }
  getMostRecentlyPublishedSurvey(guid) {
    return this.gethttp(config.survey + guid + "/revisions/published");
  }
  getSurveyAllRevisions(guid, includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.survey + guid + "/revisions" + queryString);
  }
  getSurvey(guid, createdOn) {
    return this.gethttp(config.survey + guid + "/revisions/" + createdOn);
  }
  getSurveyMostRecent(guid) {
    return this.gethttp(config.survey + guid + "/revisions/recent");
  }
  createSurvey(survey) {
    return this.post(config.surveys, survey);
  }
  publishSurvey(guid, createdOn) {
    return this.post(config.survey + guid + "/revisions/" + createdOn + "/publish");
  }
  versionSurvey(guid, createdOn) {
    return this.post(config.survey + guid + "/revisions/" + createdOn + "/version");
  }
  updateSurvey(survey) {
    let createdString = fn.formatDateTime(survey.createdOn, "iso");
    let url = config.survey + survey.guid + "/revisions/" + createdString;
    return this.post(url, survey);
  }
  deleteSurvey(survey, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    let createdString = fn.formatDateTime(survey.createdOn, "iso");
    let url = config.survey + survey.guid + "/revisions/" + createdString + queryString;
    return this.del(url);
  }
  getAllUploadSchemas(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.schemas + queryString).then(function(response) {
      response.items = response.items.filter(function(schema) {
        return !schema.surveyGuid && !schema.surveyRevision;
      });
      return response;
    });
  }
  getMostRecentUploadSchema(identifier) {
    return this.gethttp(config.schemas + "/" + identifier + "/recent");
  }
  getUploadSchemaAllRevisions(identifier, includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.schemas + "/" + identifier + queryString);
  }
  getUploadSchema(identifier, revision) {
    return this.gethttp(config.schemas + "/" + identifier + "/revisions/" + revision);
  }
  getUploads(args) {
    delete args.offsetBy;
    let queryString = fn.queryString(args);
    return this.gethttp(config.getCurrentStudy + "/uploads" + queryString).then(function(response) {
      return response;
    });
  }
  getUploadById(id) {
    return this.gettext(config.uploads + "/" + id).then(convertDataToString);
  }
  getUploadByRecordId(id) {
    return this.gettext(config.uploads + "/recordId:" + id).then(convertDataToString);
  }
  createUploadSchema(schema) {
    return this.post(config.schemasV4, schema).then(function(response) {
      schema.version = response.version;
      return response;
    });
  }
  updateUploadSchema(schema) {
    let path = config.schemasV4 + "/" + esc(schema.schemaId) + "/revisions/" + esc(schema.revision);
    return this.post(path, schema).then(function(response) {
      schema.version = response.version;
      return response;
    });
  }
  deleteSchema(schemaId, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.schemas + "/" + schemaId + queryString);
  }
  deleteSchemaRevision(schema, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.schemas + "/" + schema.schemaId + "/revisions/" + schema.revision + queryString);
  }
  getSchedulePlans(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.schemaPlans + queryString);
  }
  getSchedulePlan(guid) {
    return this.gethttp(config.schemaPlans + "/" + guid);
  }
  createSchedulePlan(plan) {
    return this.post(config.schemaPlans, plan).then(function(newPlan) {
      plan.guid = newPlan.guid;
      plan.version = newPlan.version;
      return newPlan;
    });
  }
  saveSchedulePlan(plan) {
    let path = plan.guid ? config.schemaPlans + "/" + plan.guid : config.schemaPlans;
    return this.post(path, plan).then(function(newPlan) {
      plan.guid = newPlan.guid;
      plan.version = newPlan.version;
      return newPlan;
    });
  }
  deleteSchedulePlan(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.schemaPlans + "/" + guid + queryString);
  }
  getAllSubpopulations(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.subpopulations + queryString);
  }
  getSubpopulation(guid) {
    return this.gethttp(config.subpopulations + "/" + guid);
  }
  createSubpopulation(subpop) {
    return this.post(config.subpopulations, subpop);
  }
  updateSubpopulation(subpop) {
    let path = config.subpopulations + "/" + subpop.guid;
    return this.post(path, subpop).then(function(response) {
      subpop.version = response.version;
      return response;
    });
  }
  deleteSubpopulation(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.subpopulations + "/" + guid + queryString);
  }
  verifyEmail() {
    return this.post(config.verifyEmail);
  }
  verifyStudyEmail(type) {
    return this.post(config.verifyStudyEmail + "?type=" + type);
  }
  emailStatus() {
    return this.gethttp(config.emailStatus);
  }
  getCacheKeys() {
    return this.gethttp(config.cache);
  }
  deleteCacheKey(cacheKey) {
    return this.del(config.cache + "/" + esc(cacheKey));
  }
  getParticipants(offsetBy, pageSize, emailFilter, phoneFilter, startTime, endTime) {
    let queryString = fn.queryString({ offsetBy, pageSize, emailFilter, phoneFilter, startTime, endTime });
    return this.gethttp(config.participants + queryString);
  }
  searchAccountSummaries(search) {
    return this.post(config.participants + "/search", search);
  }
  getParticipant(id) {
    return this.gethttp(config.participants + "/" + id).then(this.cacheParticipantName.bind(this));
  }
  getParticipantName(id) {
    let name = cache.get(id + ":name");
    return name ? Promise.resolve(name) : 
      this.gethttp(config.participants + "/" + id)
        .then(this.cacheParticipantName.bind(this))
        .then(() => Promise.resolve(cache.get(id + ":name")));
  }
  getParticipantRequestInfo(id) {
    return this.gethttp(config.participants + "/" + id + "/requestInfo");
  }
  getParticipantNotifications(id) {
    return this.gethttp(config.participants + "/" + id + "/notifications");
  }
  sendUserNotification(id, message) {
    return this.post(config.participants + "/" + id + "/sendNotification", message);
  }
  sendTopicNotification(guid, message) {
    return this.post(config.topics + "/" + guid + "/sendNotification", message);
  }
  sendSmsMessage(id, message) {
    return this.post(config.participants + "/" + id + "/sendSmsMessage", message);
  }
  createParticipant(participant) {
    return this.post(config.participants + "?verifyEmail=false", participant);
  }
  updateParticipant(participant) {
    cache.clear(participant.id + ":name");
    return this.post(config.participants + "/" + participant.id, participant);
  }
  deleteParticipant(id) {
    cache.clear(id + ":name");
    return this.del(config.users + "/" + id);
  }
  deleteTestUser(id) {
    cache.clear(id + ":name");
    return this.del(config.participants + "/" + id);
  }
  signOutUser(id, deleteReauthToken) {
    return this.post(config.participants + "/" + id + "/signOut" + fn.queryString({ deleteReauthToken }));
  }
  requestResetPasswordUser(id) {
    return this.post(config.participants + "/" + id + "/requestResetPassword");
  }
  resendConsentAgreement(id, subpopGuid) {
    return this.post(config.participants + "/" + id + "/consents/" + subpopGuid + "/resendConsent");
  }
  resendEmailVerification(id) {
    return this.post(config.participants + "/" + id + "/resendEmailVerification");
  }
  getExternalIds(params) {
    return this.gethttp(config.externalIds + fn.queryString(params || {}));
  }
  createExternalId(identifier) {
    return this.post(config.externalIds, identifier);
  }
  migrateExternalId(externalId, substudyId) {
    return this.post(config.externalIds + "/migrate", { externalId, substudyId });
  }
  // @Deprecated
  addExternalIds(identifiers) {
    return this.post(config.externalIds, identifiers);
  }
  deleteExternalId(id) {
    return this.del(config.externalIds + "/" + id);
  }
  getSession() {
    if (session) {
      return Promise.resolve(session);
    } else {
      return new Promise((resolve, reject) => {
        listeners.once(SESSION_STARTED_EVENT_KEY, resolve);
      });
    }
  }
  getStudyReports() {
    return this.gethttp(config.reports + fn.queryString({ type: "study" }));
  }
  getStudyReport(identifier, startDate, endDate) {
    let queryString = fn.queryString({ startDate: startDate, endDate: endDate });
    return this.gethttp(config.reports + "/" + identifier + queryString);
  }
  getPublicStudyReport(studyId, identifier, startDate, endDate) {
    let queryString = fn.queryString({ startDate: startDate, endDate: endDate });
    return this.gethttp(config.studies + "/" + studyId + "/reports/" + identifier + queryString);
  }
  addStudyReport(identifier, report) {
    return this.post(config.reports + "/" + identifier, report);
  }
  deleteStudyReport(identifier) {
    return this.del(config.reports + "/" + identifier);
  }
  deleteStudyReportRecord(identifier, date) {
    return this.del(config.reports + "/" + identifier + "/" + date);
  }
  getStudyReportIndex(identifier) {
    return this.gethttp(config.reports + "/" + identifier + "/index");
  }
  updateStudyReportIndex(index) {
    return this.post(config.reports + "/" + index.identifier + "/index", index);
  }
  getParticipantReports() {
    return this.gethttp(config.reports + fn.queryString({ type: "participant" }));
  }
  getParticipantUploads(userId, args) {
    let queryString = fn.queryString(args);
    return this.gethttp(config.participants + "/" + userId + "/uploads" + queryString);
  }
  getParticipantReport(userId, identifier, startDate, endDate) {
    let queryString = fn.queryString({ startDate, endDate });
    return this.gethttp(config.participants + "/" + userId + "/reports/" + identifier + queryString);
  }
  getParticipantReportIndex(identifier) {
    return this.gethttp(config.participants + "/reports/" + identifier + "/index");
  }
  getParticipantActivityEvents(userId) {
    return this.gethttp(config.participants + "/" + userId + "/activityEvents");
  }
  addParticipantReport(userId, identifier, report) {
    return this.post(config.participants + "/" + userId + "/reports/" + identifier, report);
  }
  deleteParticipantReport(identifier, userId) {
    return this.del(config.participants + "/" + userId + "/reports/" + identifier);
  }
  deleteParticipantReportRecord(userId, identifier, date) {
    return this.del(config.participants + "/" + userId + "/reports/" + identifier + "/" + date);
  }
  getParticipantActivities(userId, activityGuid, params) {
    let queryString = fn.queryString(params);
    return this.gethttp(config.participants + "/" + userId + "/activities/" + activityGuid + queryString);
  }
  getParticipantNewActivities(userId, referentType, guid, params) {
    let queryString = fn.queryString(params);
    return this.gethttp(config.participants + "/" + userId + "/activities/" + referentType.toLowerCase() + 
      "/" + encodeURIComponent(guid) + queryString
    );
  }
  deleteParticipantActivities(userId) {
    return this.del(config.participants + "/" + userId + "/activities");
  }
  withdrawParticipantFromStudy(userId, reason) {
    return this.post(config.participants + "/" + userId + "/consents/withdraw", reason);
  }
  withdrawParticipantFromSubpopulation(userId, subpopGuid, reason) {
    return this.post(config.participants + "/" + userId + "/consents/" + subpopGuid + "/withdraw", reason);
  }
  getAllTopics(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.topics + queryString);
  }
  getTopic(guid) {
    return this.gethttp(config.topics + "/" + guid);
  }
  createTopic(topic) {
    return this.post(config.topics, topic);
  }
  updateTopic(topic) {
    return this.post(config.topics + "/" + topic.guid, topic);
  }
  deleteTopic(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.topics + "/" + guid + queryString);
  }
  getTaskDefinitions() {
    return this.gethttp(config.compoundactivitydefinitions);
  }
  createTaskDefinition(task) {
    return this.post(config.compoundactivitydefinitions, task);
  }
  getTaskDefinition(taskId) {
    return this.gethttp(config.compoundactivitydefinitions + "/" + esc(taskId));
  }
  updateTaskDefinition(task) {
    return this.post(config.compoundactivitydefinitions + "/" + esc(task.taskId), task);
  }
  deleteTaskDefinition(taskId) {
    return this.del(config.compoundactivitydefinitions + "/" + esc(taskId));
  }
  getMetadata(search, modType) {
    // mostrecent: "true", published: "false", name: null, notes: null, tags: null
    search = search || {};
    let queryString = fn.queryString(search);
    return this.gethttp(config.metadata + queryString).then(function(response) {
      if (modType === "survey" || modType === "schema") {
        response.items = response.items.filter(function(item) {
          return item.moduleType === modType;
        });
      }
      return response;
    });
  }
  createMetadata(metadata) {
    return this.post(config.metadata, metadata);
  }
  getMetadataLatestVersion(id) {
    return this.gethttp(config.metadata + "/" + esc(id));
  }
  getMetadataVersion(id, version) {
    return this.gethttp(config.metadata + "/" + esc(id) + "/versions/" + esc(version));
  }
  getMetadataAllVersions(id, includeDeleted) {
    // id, mostrecent: "true", published: "false", name: null, notes: null, tags: null
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true, mostrecent: false });
    return this.gethttp(config.metadata + "/" + esc(id) + "/versions" + queryString);
  }
  updateMetadata(metadata) {
    return this.post(config.metadata + "/" + esc(metadata.id) + "/versions/" + esc(metadata.version), metadata);
  }
  deleteMetadata(id, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.metadata + "/" + esc(id) + "/versions" + queryString);
  }
  deleteMetadataVersion(id, version, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.metadata + "/" + esc(id) + "/versions/" + esc(version) + queryString);
  }
  importMetadata(id, version) {
    let url = typeof version === "number" ? 
      config.sharedmodules + "/" + esc(id) + "/versions/" + esc(version) + "/import" : 
      config.sharedmodules + "/" + esc(id) + "/import";
    return this.post(url);
  }
  startExport() {
    return this.post(config.export + "/start");
  }
  getAppConfigs(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.appConfigs + queryString);
  }
  getAppConfig(guid) {
    return this.gethttp(config.appConfigs + "/" + guid);
  }
  createAppConfig(appConfig) {
    return this.post(config.appConfigs, appConfig);
  }
  updateAppConfig(appConfig) {
    return this.post(config.appConfigs + "/" + appConfig.guid, appConfig);
  }
  deleteAppConfig(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.appConfigs + "/" + guid + queryString);
  }
  adminSignIn(studyName, environment, signIn) {
    return postInt(config.host[environment] + config.adminAuth + "/signIn", signIn).then(
      this.cacheSession(studyName, signIn.study, environment)
    );
  }
  changeAdminStudy(studyName, studyId) {
    return postInt(config.host[session.environment] + config.adminAuth + "/study", { study: studyId }).then(
      this.cacheSession(studyName, studyId, session.environment)
    );
  }
  getAppConfigElements(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.appConfigElements + queryString);
  }
  getAppConfigElementRevisions(id, includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.appConfigElements + "/" + id + queryString);
  }
  getMostRecentAppConfigElement(id) {
    return this.gethttp(config.appConfigElements + "/" + id + "/recent");
  }
  getAppConfigElement(id, revision) {
    return this.gethttp(config.appConfigElements + "/" + id + "/revisions/" + revision);
  }
  deleteAppConfigElement(id, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.appConfigElements + "/" + id + queryString);
  }
  deleteAppConfigElementRevision(id, revision, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.appConfigElements + "/" + id + "/revisions/" + revision + queryString);
  }
  createAppConfigElement(element) {
    return this.post(config.appConfigElements, element);
  }
  updateAppConfigElement(element) {
    return this.post(config.appConfigElements + "/" + element.id + "/revisions/" + element.revision, element);
  }
  getSubstudies(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.substudies + queryString);
  }
  createSubstudy(substudy) {
    return this.post(config.substudies, substudy);
  }
  getSubstudy(id) {
    return this.gethttp(config.substudies + "/" + id);
  }
  updateSubstudy(substudy) {
    return this.post(config.substudies + "/" + substudy.id, substudy);
  }
  deleteSubstudy(id, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(config.substudies + "/" + id + queryString);
  }
  addSessionStartListener(listener) {
    if (typeof listener !== "function") {
      throw Error("Session listener not a function");
    }
    listeners.addEventListener(SESSION_STARTED_EVENT_KEY, listener);
  }
  addSessionEndListener(listener) {
    if (typeof listener !== "function") {
      throw Error("Session listener not a function");
    }
    listeners.addEventListener(SESSION_ENDED_EVENT_KEY, listener);
  }
}

export const serverService = new ServerService();
