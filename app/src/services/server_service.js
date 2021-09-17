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
const ERROR = "Session listener not a function";
const ADMIN_ROLES = Object.freeze(["developer", "researcher", "admin", "org_admin", 
  "study_coordinator", "study_designer", "superadmin"]);

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
    timeout: 40000
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
  }
  initSession() {
    session = storeService.get(SESSION_KEY);
    if (session && session.environment) {
      listeners.emit(SESSION_STARTED_EVENT_KEY, session);
    } else {
      listeners.emit(SESSION_ENDED_EVENT_KEY, session);
    }    
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
    }).then(func).catch(this.reloadPageWhenSessionLost.bind(this));
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
      return ADMIN_ROLES.indexOf(role) > -1;
    });
  }
  cacheParticipantName(response) {
    if (response && response.id) {
      response.name = fn.formatNameAsFullLabel(response);
      let id = (session && session.id === response.id) ? 'self' : response.id;
      cache.set(id + ":name", response);
    }
    return response;
  }
  cacheSession(appName, appId, env) {
    // Initial sign in we capture some information not in the session. Thereafer we have
    // to copy it on reauthentication to any newly acquired session.
    return (sess) => {
      if (appName) {
        sess.appName = appName;
        sess.appId = appId;
        sess.host = config.host[env];
        sess.isSupportedUser = this.isSupportedUser;
      } else {
        fn.copyProps(sess, session, "appName", "appId", "host", "isSupportedUser");
      }
      // Easier than testing for superadmin everywhere.
      if (sess.roles.includes('superadmin')) {
        sess.roles = ADMIN_ROLES;
      }
      session = sess;
      storeService.set(SESSION_KEY, session);
      listeners.emit(SESSION_STARTED_EVENT_KEY, session);
      return session;
    };
  }
  isAuthenticated() {
    return session !== null;
  }
  signIn(appName, env, signIn) {
    return postInt(config.host[env] + config.signIn, signIn)
      .then(this.cacheSession(appName, signIn.appId, env));
  }
  phoneSignIn(appName, env, signIn) {
    return postInt(config.host[env] + config.phoneSignIn, signIn)
      .then(this.cacheSession(appName, signIn.appId, env));
  }
  oauthSignIn(appName, env, signIn) {
    return postInt(config.host[env] + config.oauthSignIn, signIn)
      .then(this.cacheSession(appName, signIn.appId, env));
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
    let reauth = { appId: session.appId, email: session.email, reauthToken: session.reauthToken };
    return postInt(config.host[session.environment] + config.reauth, reauth).then(this.cacheSession());
  }
  getApps(env, includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return getInt(config.host[env] + config.getAppList + queryString)
      .then(fn.handleSort("items", "name"));
  }
  getAppList(env, includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true, summary: true  });
    return getInt(config.host[env] + config.getAppList + queryString)
      .then(fn.handleSort("items", "name"));
  }
  requestPhoneSignIn(env, data) {
    return postInt(config.host[env] + config.requestPhoneSignIn, data);
  }
  requestResetPassword(env, data) {
    return postInt(config.host[env] + config.requestResetPassword, data);
  }
  getApp() {
    return this.gethttp(config.getCurrentApp).then((app) => {
      // Due to a change in the app object, enableReauthentication cannot be null, it must be set
      if (typeof app.reauthenticationEnabled === "undefined") {
        app.reauthenticationEnabled = false;
      }
      return app;
    });
  }
  getAppById(identifier) {
    return this.gethttp(config.getApp + identifier);
  }
  createApp(appAndUsers) {
    return this.post(config.getApp + "init", appAndUsers);
  }
  deleteApp(appId, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.getApp}${appId}${queryString}`);
  }
  getAppPublicKey() {
    return this.gethttp(config.getAppPublicKey);
  }
  saveApp(app) {
    let asSuperAdmin = (session && session.roles.indexOf("superadmin") > -1) ? true : false;
    let url = asSuperAdmin ? config.getApp + app.identifier : config.getCurrentApp;
    return this.post(url, app).then(function(response) {
      app.version = response.version;
      return response;
    });
  }
  createSynapseProject(synapseUserId) {
    return this.post(`${config.getCurrentApp}/synapseProject`, [synapseUserId]);
  }
  getMostRecentStudyConsent(guid) {
    return this.gethttp(`${config.subpopulations}/${guid}/consents/recent`);
  }
  getMostRecentStudyConsent(guid) {
    return this.gethttp(`${config.subpopulations}/${guid}/consents/recent`);
  }
  getStudyConsent(guid, createdOn) {
    return this.gethttp(`${config.subpopulations}/${guid}/consents/${createdOn}`);
  }
  saveStudyConsent(guid, consent) {
    return this.post(`${config.subpopulations}/${guid}/consents`, consent);
  }
  publishStudyConsent(guid, createdOn) {
    return this.post(`${config.subpopulations}/${guid}/consents/${createdOn}/publish`);
  }
  getConsentHistory(guid) {
    return this.gethttp(`${config.subpopulations}/${guid}/consents`);
  }
  emailRoster() {
    return this.post(`${config.users}/emailParticipantRoster`);
  }
  getSurveys(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.surveys + queryString);
  }
  getPublishedSurveys() {
    return this.gethttp(`${config.surveys}/published`);
  }
  getMostRecentlyPublishedSurvey(guid) {
    return this.gethttp(`${config.survey}/${guid}/revisions/published`);
  }
  getSurveyAllRevisions(guid, includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(`${config.survey}/${guid}/revisions${queryString}`);
  }
  getSurvey(guid, createdOn) {
    return this.gethttp(`${config.survey}/${guid}/revisions/${createdOn}`);
  }
  getSurveyMostRecent(guid) {
    return this.gethttp(`${config.survey}/${guid}/revisions/recent`);
  }
  createSurvey(survey) {
    return this.post(config.surveys, survey);
  }
  publishSurvey(guid, createdOn) {
    return this.post(`${config.survey}/${guid}/revisions/${createdOn}/publish`);
  }
  versionSurvey(guid, createdOn) {
    return this.post(`${config.survey}/${guid}/revisions/${createdOn}/version`);
  }
  updateSurvey(survey) {
    let createdString = fn.formatDateTime(survey.createdOn, "iso");
    return this.post(`${config.survey}/${survey.guid}/revisions/${createdString}`, survey);
  }
  deleteSurvey(survey, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    let createdString = fn.formatDateTime(survey.createdOn, "iso");
    return this.del(`${config.survey}/${survey.guid}/revisions/${createdString}${queryString}`);
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
    return this.gethttp(`${config.schemas}/${identifier}/recent`);
  }
  getUploadSchemaAllRevisions(identifier, includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(`${config.schemas}/${identifier}${queryString}`);
  }
  getUploadSchema(identifier, revision) {
    return this.gethttp(`${config.schemas}/${identifier}/revisions/${revision}`);
  }
  getUploads(args) {
    let queryString = fn.queryString(args);
    return this.gethttp(`${config.getCurrentApp}/uploads${queryString}`);
  }
  getUploadById(id) {
    return this.gettext(`${config.uploads}/${id}`).then(convertDataToString);
  }
  getUploadByRecordId(id) {
    return this.gettext(`${config.uploads}/recordId:${id}`).then(convertDataToString);
  }
  createUploadSchema(schema) {
    return this.post(config.schemasV4, schema).then(function(response) {
      schema.version = response.version;
      return response;
    });
  }
  updateUploadSchema(schema) {
    let path = `${config.schemasV4}/${esc(schema.schemaId)}/revisions/${esc(schema.revision)}`
    return this.post(path, schema).then(function(response) {
      schema.version = response.version;
      return response;
    });
  }
  deleteSchema(schemaId, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.schemas}/${schemaId}${queryString}`);
  }
  deleteSchemaRevision(schema, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.schemas}/${schema.schemaId}/revisions/${schema.revision}${queryString}`);
  }
  getSchedulePlans(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.schemaPlans + queryString);
  }
  getSchedulePlan(guid) {
    return this.gethttp(`${config.schemaPlans}/${guid}`);
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
    // TODO: User this pattern for updating keys/versions/revisions in all calls and remove
    // from viewmodel code.
    return this.post(path, plan).then(function(newPlan) {
      plan.guid = newPlan.guid;
      plan.version = newPlan.version;
      return newPlan;
    });
  }
  deleteSchedulePlan(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.schemaPlans}/${guid}${queryString}`);
  }
  getAllSubpopulations(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.subpopulations + queryString);
  }
  getSubpopulation(guid) {
    return this.gethttp(`${config.subpopulations}/${guid}`);
  }
  createSubpopulation(subpop) {
    return this.post(config.subpopulations, subpop);
  }
  updateSubpopulation(subpop) {
    return this.post(`${config.subpopulations}/${subpop.guid}`, subpop).then(function(response) {
      subpop.version = response.version;
      return response;
    });
  }
  deleteSubpopulation(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.subpopulations}/${guid}${queryString}`);
  }
  verifyEmail() {
    return this.post(config.verifyEmail);
  }
  verifyAppEmail(type) {
    return this.post(`${config.verifyAppEmail}?type=${type}`);
  }
  emailStatus() {
    return this.gethttp(config.emailStatus);
  }
  getCacheKeys() {
    return this.gethttp(config.cache);
  }
  deleteCacheKey(cacheKey) {
    return this.del(`${config.cache}/${esc(cacheKey)}`);
  }
  // TODO: This can be removed, but you need to refactor and test.
  getParticipants(offsetBy, pageSize, emailFilter, phoneFilter, startTime, endTime) {
    let queryString = fn.queryString({ offsetBy, pageSize, emailFilter, phoneFilter, startTime, endTime });
    return this.gethttp(config.participants + queryString);
  }
  searchAccountSummaries(search) {
    return this.post(`${config.participants}/search`, search);
  }
  searchUnassignedAdminAccounts(search) {
    return this.post(`${config.organizations}/nonmembers`, search);
  }
  getParticipant(id) {
    if (session && session.id === id) {
      id = 'self';
    }
    return this.gethttp(`${config.participants}/${id}`)
      .then(this.cacheParticipantName.bind(this));
  }

  getParticipantName(id) {
    if (session && session.id === id) {
      id = 'self';
    }
    let name = cache.get(id + ":name");
    return name ? Promise.resolve(name) : 
      this.gethttp(config.participants + "/" + id)
        .then(this.cacheParticipantName.bind(this));
  }
  getParticipantRequestInfo(id) {
    return this.gethttp(`${config.participants}/${id}/requestInfo`);
  }
  getParticipantNotifications(id) {
    return this.gethttp(`${config.participants}/${id}/notifications`);
  }
  getParticipantRecentSmsMessage(id) {
    return this.gethttp(`${config.participants}/${id}/sms/recent`);
  }
  getParticipantEnrollments(id) {
    return this.gethttp(`${config.participants}/${id}/enrollments`);
  }
  sendUserNotification(id, message) {
    return this.post(`${config.participants}/${id}/sendNotification`, message);
  }
  sendTopicNotification(guid, message) {
    return this.post(`${config.topics}/${guid}/sendNotification`, message);
  }
  createParticipant(participant) {
    return this.post(config.participants, participant);
  }
  updateParticipant(participant) {
    cache.clear(participant.id + ":name");
    return this.post(`${config.participants}/${participant.id}`, participant);
  }
  deleteParticipant(id) {
    cache.clear(id + ":name");
    return this.del(`${config.users}/${id}`);
  }
  deleteTestUser(id) {
    cache.clear(id + ":name");
    return this.del(`${config.participants}/${id}`);
  }
  deleteParticipantActivities(id) {
    return this.del(`${config.participants}/${id}/activities`);
  }
  signOutUser(id, deleteReauthToken) {
    return this.post(`${config.participants}/${id}/signOut${fn.queryString({ deleteReauthToken })}`);
  }
  requestResetPasswordUser(id) {
    return this.post(`${config.participants}/${id}/requestResetPassword`);
  }
  resendConsentAgreement(id, subpopGuid) {
    return this.post(`${config.participants}/${id}/consents/${subpopGuid}/resendConsent`);
  }
  resendEmailVerification(id) {
    return this.post(`${config.participants}/${id}/resendEmailVerification`);
  }
  resendPhoneVerification(id) {
    return this.post(`${config.participants}/${id}/resendPhoneVerification`);
  }
  sendInstallLink(id) {
    return this.post(`${config.participants}/${id}/sendInstallLink`);
  }
  getExternalIdsForStudy(studyId, params) {
    return this.gethttp(`${config.studies}/${studyId}/externalids${fn.queryString(params || {})}`);
  }
  createExternalId(identifier) {
    return this.post(config.externalIds, identifier);
  }
  // @Deprecated
  addExternalIds(identifiers) {
    return this.post(config.externalIds, identifiers);
  }
  deleteExternalId(id) {
    return this.del(`${config.externalIds}/${id}`);
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
    return this.gethttp(`${config.reports}${fn.queryString({ type: "study" })}`);
  }
  getStudyReport(identifier, startDate, endDate) {
    let queryString = fn.queryString({ startDate: startDate, endDate: endDate });
    return this.gethttp(`${config.reports}/${identifier}${queryString}`);
  }
  getPublicStudyReport(appId, identifier, startDate, endDate) {
    let queryString = fn.queryString({ startDate: startDate, endDate: endDate });
    return this.gethttp(`${config.apps}/${appId}/reports/${identifier}${queryString}`);
  }
  addStudyReport(identifier, report) {
    return this.post(`${config.reports}/${identifier}`, report);
  }
  deleteStudyReport(identifier) {
    return this.del(`${config.reports}/${identifier}`);
  }
  deleteStudyReportRecord(identifier, date) {
    return this.del(`${config.reports}/${identifier}/${date}`);
  }
  getStudyReportIndex(identifier) {
    return this.gethttp(`${config.reports}/${identifier}/index`);
  }
  updateStudyReportIndex(index) {
    return this.post(`${config.reports}/${index.identifier}/index`, index);
  }
  getParticipantReports() {
    return this.gethttp(`${config.reports}${fn.queryString({ type: "participant" })}`);
  }
  getParticipantUploads(userId, args) {
    let queryString = fn.queryString(args);
    return this.gethttp(`${config.participants}/${userId}/uploads${queryString}`);
  }
  getParticipantReport(userId, identifier, startDate, endDate) {
    let queryString = fn.queryString({ startDate, endDate });
    return this.gethttp(`${config.participants}/${userId}/reports/${identifier}${queryString}`);
  }
  getParticipantReportIndex(identifier) {
    return this.gethttp(`${config.participants}/reports/${identifier}/index`);
  }
  getParticipantActivityEvents(userId) {
    return this.gethttp(`${config.participants}/${userId}/activityevents`);
  }
  addParticipantReport(userId, identifier, report) {
    return this.post(`${config.participants}/${userId}/reports/${identifier}`, report);
  }
  deleteParticipantReport(identifier, userId) {
    return this.del(`${config.participants}/${userId}/reports/${identifier}`);
  }
  deleteParticipantReportRecord(userId, identifier, date) {
    return this.del(`${config.participants}/${userId}/reports/${identifier}/${date}`);
  }
  getParticipantActivities(userId, activityGuid, params) {
    let queryString = fn.queryString(params);
    return this.gethttp(`${config.participants}/${userId}/activities/${activityGuid}${queryString}`);
  }
  getParticipantNewActivities(userId, referentType, guid, params) {
    let refType = referentType.toLowerCase();
    let encGuid = encodeURIComponent(guid);
    let queryString = fn.queryString(params);
    return this.gethttp(`${config.participants}/${userId}/activities/${refType}/${encGuid}${queryString}`);
  }
  deleteParticipantActivities(userId) {
    return this.del(`${config.participants}/${userId}/activities`);
  }
  withdrawParticipantFromApp(userId, reason) {
    return this.post(`${config.participants}/${userId}/consents/withdraw`, reason);
  }
  withdrawParticipantFromSubpopulation(userId, subpopGuid, reason) {
    return this.post(`${config.participants}/${userId}/consents/${subpopGuid}/withdraw`, reason);
  }
  getAllTopics(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.topics + queryString);
  }
  getTopic(guid) {
    return this.gethttp(`${config.topics}/${guid}`);
  }
  createTopic(topic) {
    return this.post(config.topics, topic);
  }
  updateTopic(topic) {
    return this.post(`${config.topics}/${topic.guid}`, topic);
  }
  deleteTopic(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.topics}/${guid}${queryString}`);
  }
  getTaskDefinitions() {
    return this.gethttp(config.compoundactivitydefinitions);
  }
  createTaskDefinition(task) {
    return this.post(config.compoundactivitydefinitions, task);
  }
  getTaskDefinition(taskId) {
    return this.gethttp(`${config.compoundactivitydefinitions}/${esc(taskId)}`);
  }
  updateTaskDefinition(task) {
    return this.post(`${config.compoundactivitydefinitions}/${esc(task.taskId)}`, task);
  }
  deleteTaskDefinition(taskId) {
    return this.del(`${config.compoundactivitydefinitions}/${esc(taskId)}`);
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
    return this.gethttp(`${config.metadata}/${esc(id)}`);
  }
  getMetadataVersion(id, version) {
    return this.gethttp(`${config.metadata}/${esc(id)}/versions/${esc(version)}`);
  }
  getMetadataAllVersions(id, includeDeleted) {
    // id, mostrecent: "true", published: "false", name: null, notes: null, tags: null
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true, mostrecent: false });
    return this.gethttp(`${config.metadata}/${esc(id)}/versions${queryString}`);
  }
  updateMetadata(metadata) {
    return this.post(`${config.metadata}/${esc(metadata.id)}/versions/${esc(metadata.version)}`, metadata);
  }
  deleteMetadata(id, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.metadata}/${esc(id)}/versions${queryString}`);
  }
  deleteMetadataVersion(id, version, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.metadata}/${esc(id)}/versions/${esc(version)}${queryString}`);
  }
  importMetadata(id, version) {
    let url = typeof version === "number" ? 
      `${config.sharedmodules}/${esc(id)}/versions/${esc(version)}/import` : 
      `${config.sharedmodules}/${esc(id)}/import`;
    return this.post(url);
  }
  startExport() {
    return this.post(`${config.export}/start`);
  }
  getAppConfigs(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.appConfigs + queryString);
  }
  getAppConfig(guid) {
    return this.gethttp(`${config.appConfigs}/${guid}`).then((response) => {
      response.fileReferences = response.fileReferences || [];
      return response;
    });
  }
  createAppConfig(appConfig) {
    return this.post(config.appConfigs, appConfig);
  }
  updateAppConfig(appConfig) {
    return this.post(`${config.appConfigs}/${appConfig.guid}`, appConfig);
  }
  deleteAppConfig(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.appConfigs}/${guid}${queryString}`);
  }

  getTags() {
    return this.gethttp(`/v1/tags`);
  }
  deleteTag(name) {
    return this.del(`/v1/tags/${name}`);
  }

  getAssessment(guid) {
    return this.gethttp(`${config.assessments}/${guid}`);
  }
  getAssessmentRevisions(guid, query, includeDeleted) {
    let queryString = fn.queryString({ 
      offsetBy: query.offsetBy, 
      pageSize: query.pageSize, 
      includeDeleted: includeDeleted === true
    });
    return this.gethttp(`${config.assessments}/${guid}/revisions${queryString}`)
  }
  getAssessments(tags = '', offsetBy, pageSize, includeDeleted) { 
    let tag = tags.replace(/[^\sa-zA-Z0-9-_]+/g,' ').replace(/\s+/g, ' ')
      .trim().split(' ').filter(s => s.length);
    let queryString = fn.queryString({ tag, offsetBy, pageSize, includeDeleted: includeDeleted === true});
    return this.gethttp(config.assessments + queryString);
  }
  publishAssessment(guid, newIdentifier) {
    return this.post(`${config.assessments}/${guid}/publish?newIdentifier=${newIdentifier}`);
  }
  deleteAssessment(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.assessments}/${guid}${queryString}`);
  }
  createAssessment(assessment) { 
    return this.post(config.assessments, assessment);
  }
  createAssessmentRevision(assessment) {
    return this.post(`/v1/assessments/${assessment.guid}/revisions`, assessment);
  }
  updateAssessment(assessment) { 
    return this.post(`${config.assessments}/${assessment.guid}`, assessment);
  }
  getAssessmentConfig(guid) {
    return this.gethttp(`${config.assessments}/${guid}/config`);
  }
  updateAssessmentConfig(guid, assessmentConfig) {
    return this.post(`${config.assessments}/${guid}/config`, assessmentConfig);
  }
  customizeAssessmentConfig(guid, map) {
    return this.post(`${config.assessments}/${guid}/config/customize`, map);
  }

  getAssessmentResources(id, query, includeDeleted) {
    query.includeDeleted = includeDeleted === true;
    let queryString = fn.queryString(query);
    return this.gethttp(`${config.assessments}/identifier:${id}/resources${queryString}`);
  }
  createAssessmentResource(id, resource) {
    return this.post(`${config.assessments}/identifier:${id}/resources`, resource);
  }
  getAssessmentResource(id, resourceGuid) {
    return this.gethttp(`${config.assessments}/identifier:${id}/resources/${resourceGuid}`);
  }
  updateAssessmentResource(id, resource) {
    return this.post(`${config.assessments}/identifier:${id}/resources/${resource.guid}`, resource);
  }
  deleteAssessmentResource(id, resourceGuid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.assessments}/identifier:${id}/resources/${resourceGuid}${queryString}`);
  }
  publishAssessmentResources(id, guids) {
    return this.post(`${config.assessments}/identifier:${id}/resources/publish`, guids);
  }

  importSharedAssessment(guid, newIdentifier) {
    return this.post(`${config.sharedassessments}/${guid}/import?newIdentifier=${newIdentifier}`);
  }
  getSharedAssessments(query, includeDeleted) {
    query.includeDeleted = includeDeleted === true;
    let queryString = fn.queryString(query);
    return this.gethttp(`${config.sharedassessments}${queryString}`);
  }
  getSharedAssessment(guid) {
    return this.gethttp(`${config.sharedassessments}/${guid}`);
  }
  getSharedAssessmentRevisions(guid, query, includeDeleted) {
    let queryString = fn.queryString({ 
      offsetBy: query.offsetBy, 
      pageSize: query.pageSize, 
      includeDeleted: includeDeleted === true
    });
    return this.gethttp(`${config.sharedassessments}/${guid}/revisions${queryString}`)
  }
  updateSharedAssessment(assessment) { 
    return this.post(`${config.sharedassessments}/${assessment.guid}`, assessment);
  }
  deleteSharedAssessment(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.sharedassessments}/${guid}${queryString}`);
  }
  getSharedAssessmentConfig(guid) {
    return this.gethttp(`${config.sharedassessments}/${guid}/config`);
  }

  getSharedAssessmentResources(id, query, includeDeleted) {
    query.includeDeleted = includeDeleted === true;
    let queryString = fn.queryString(query);
    return this.gethttp(`${config.sharedassessments}/identifier:${id}/resources${queryString}`);
  }
  getSharedAssessmentResource(id, resourceGuid) {
    return this.gethttp(`${config.sharedassessments}/identifier:${id}/resources/${resourceGuid}`);
  }
  updateSharedAssessmentResource(id, resource) {
    return this.post(`${config.sharedassessments}/identifier:${id}/resources/${resource.guid}`, resource);
  }
  deleteSharedAssessmentResource(id, resourceGuid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.sharedassessments}/identifier:${id}/resources/${resourceGuid}${queryString}`);
  }
  importAssessmentResource(id, guid) {
    return this.post(`${config.sharedassessments}/identifier:${id}/resources/import`, [guid]);
  }

  // At least for now, it's useful to see them to delete them. This is probably going away.
  getSchedules(query, includeDeleted) {
    let queryString = fn.queryString({ 
      offsetBy: query.offsetBy, 
      pageSize: query.pageSize, 
      includeDeleted: includeDeleted === true
    });
    return this.gethttp(config.schedules + queryString);
  }
  getStudySchedule(studyId) {
    return this.gethttp(`${config.studies}/${studyId}/schedule`);
  }
  createOrUpdateStudySchedule(studyId, schedule) {
    return this.post(`${config.studies}/${studyId}/schedule`, schedule);
  }
  getStudyScheduleTimeline(studyId) {
    return this.gethttp(`${config.studies}/${studyId}/timeline`);
  }
  deleteSchedule(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.schedules}/${guid}${queryString}`);
  }
  getStudyParticipantTimeline(studyId, userId) {
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}/timeline`);
  }

  adminSignIn(appName, environment, signIn) {
    return postInt(`${config.host[environment]}${config.adminAuth}/signIn`, signIn).then(
      this.cacheSession(appName, signIn.appId, environment)
    );
  }
  changeAdminApp(appName, appId) {
    return postInt(`${config.host[session.environment]}${config.adminAuth}/app`, { appId }).then(
      this.cacheSession(appName, appId, session.environment)
    );
  }
  getAppMemberships() {
    return this.gethttp('/v1/apps/memberships');
  }
  changeApp(appName, appId) {
    return this.post('/v3/auth/app', { appId }).then(
      this.cacheSession(appName, appId, session.environment)
    );
  }
  getAppConfigElements(includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(config.appConfigElements + queryString);
  }
  getAppConfigElementRevisions(id, includeDeleted) {
    let queryString = fn.queryString({ includeDeleted: includeDeleted === true });
    return this.gethttp(`${config.appConfigElements}/${id}${queryString}`);
  }
  getMostRecentAppConfigElement(id) {
    return this.gethttp(`${config.appConfigElements}/${id}/recent`);
  }
  getAppConfigElement(id, revision) {
    return this.gethttp(`${config.appConfigElements}/${id}/revisions/${revision}`);
  }
  deleteAppConfigElement(id, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.appConfigElements}/${id}${queryString}`);
  }
  deleteAppConfigElementRevision(id, revision, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.appConfigElements}/${id}/revisions/${revision}${queryString}`);
  }
  createAppConfigElement(element) {
    return this.post(config.appConfigElements, element);
  }
  updateAppConfigElement(element) {
    return this.post(`${config.appConfigElements}/${element.id}/revisions/${element.revision}`, element);
  }
  getStudies(query) {
    let queryString = fn.queryString(query);
    return this.gethttp(config.studies + queryString);
  }
  createStudy(study) {
    return this.post(config.studies, study);
  }
  getStudy(id) {
    return this.gethttp(`${config.studies}/${id}`);
  }
  updateStudy(study) {
    return this.post(`${config.studies}/${study.identifier}`, study);
  }
  deleteStudy(id, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.studies}/${id}${queryString}`);
  }
  transitionTo(id, phase) {
    return this.post(`${config.studies}/${id}/${phase}`);
  }
  getSponsors(studyId, query) {
    let queryString = fn.queryString(query);
    return this.gethttp(`/v5/studies/${studyId}/sponsors${queryString}`);
  }
  getSponsoredStudies(orgId, query) {
    let queryString = fn.queryString(query);
    return this.gethttp(`/v1/organizations/${orgId}/studies${queryString}`);
  }
  addSponsor(studyId, orgId) {
    return this.post(`/v5/studies/${studyId}/sponsors/${orgId}`);
  }
  removeSponsor(studyId, orgId) {
    return this.del(`/v5/studies/${studyId}/sponsors/${orgId}`);
  }
  removeSponsored(orgId, studyId) {
    return this.del(`/v5/studies/${studyId}/sponsors/${orgId}`);
  }
  getEnrollments(studyId, query) {
    let queryString = fn.queryString(query);
    return this.gethttp(`/v5/studies/${studyId}/enrollments${queryString}`);
  }
  enroll(studyId, userId, extId) {
    let payload = {userId};
    if (extId) { payload.externalId = extId };
    return this.post(`/v5/studies/${studyId}/enrollments`, payload);
  }
  unenroll(studyId, userId, withdrawalNote) {
    let queryString = fn.queryString({withdrawalNote});
    return this.del(`/v5/studies/${studyId}/enrollments/${userId}${queryString}`);
  }
  getStudyParticipants(studyId, search) {
    return this.post(`${config.studies}/${studyId}/participants/search`, search);
  }
  getStudyParticipant(studyId, userId) {
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}`);
  }
  getStudyParticipantRequestInfo(studyId, userId) {
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}/requestInfo`);
  }
  getStudyParticipantNotifications(studyId, userId) {
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}/notifications`);
  }
  getStudyParticipantRecentSmsMessage(studyId, userId) {
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}/sms/recent`);
  }
  getStudyParticipantEnrollments(studyId, userId) {
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}/enrollments`);
  }
  getStudyParticipantUploads(studyId, userId, args) {
    let queryString = fn.queryString(args);
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}/uploads${queryString}`);
  }
  getStudyParticipantTimeline(studyId, userId) {
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}/timeline`);
  }
  getStudyParticipantAdherenceRecords(studyId, userId, search) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/adherence/search`, search);
  }
  updateStudyParticipantAdherenceRecords(studyId, userId, records) { 
    return this.post(`${config.studies}/${studyId}/participants/${userId}/adherence`, records);
  }
  getStudyParticipantName(studyId, id) {
    if (session && session.id === id) {
      id = 'self';
    }
    let name = cache.get(id + ":name");
    return name ? Promise.resolve(name) : 
      this.gethttp(`${config.studies}/${studyId}/participants/${id}`)
        .then(this.cacheParticipantName.bind(this));
  }
  createStudyParticipant(studyId, participant) {
    return this.post(`${config.studies}/${studyId}/participants`, participant);
  }
  updateStudyParticipant(studyId, participant) {
    cache.clear(participant.id + ":name");
    return this.post(`${config.studies}/${studyId}/participants/${participant.id}`, participant);
  }
  deleteStudyParticipant(studyId, userId) {
    return this.del(`${config.studies}/${studyId}/participants/${userId}`);
  }
  
  getStudyParticipantActivityEvents(studyId, userId) {
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}/activityevents`);
  }
  getStudyParticipantActivityEventHistory(studyId, userId, eventId, offsetBy, pageSize) {
    let queryString = fn.queryString({ offsetBy, pageSize });
    return this.gethttp(`${config.studies}/${studyId}/participants/${userId}/activityevents/${encodeURIComponent(eventId)}${queryString}`);
  }
  createStudyParticipantActivityEvent(studyId, userId, event) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/activityevents`, event);
  }
  deleteStudyParticipantActivityEvent(studyId, userId, eventId) {
    return this.del(`${config.studies}/${studyId}/participants/${userId}/activityevents/${eventId}`);
  }
  withdrawStudyParticipantFromStudy(studyId, userId, subpopGuid, reason) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/consents/${subpopGuid}/withdraw`, reason);
  }
  sendStudyParticipantNotification(studyId, userId, message) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/sendNotification`, message);
  }
  signOutStudyParticipant(studyId, userId, deleteReauthToken) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/signOut${fn.queryString({ deleteReauthToken })}`);
  }
  requestStudyParticipantResetPassword(studyId, userId) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/requestResetPassword`);
  }
  resendStudyParticipantConsentAgreement(studyId, userId, subpopGuid) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/consents/${subpopGuid}/resendConsent`);
  }
  resendStudyParticipantEmailVerification(studyId, userId) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/resendEmailVerification`);
  }
  resendStudyParticipantPhoneVerification(studyId, userId) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/resendPhoneVerification`);
  }
  createLogoUpload(studyId, revision) {
    return this.post(`${config.studies}/${studyId}/logo`, revision);
  }
  finishLogoUpload(studyId, createdOn) {
    return this.post(`${config.studies}/${studyId}/logo/${createdOn}`);
  }
  sendStudyParticipantInstallLink(studyId, userId) {
    return this.post(`${config.studies}/${studyId}/participants/${userId}/sendInstallLink`);
  }
  getTemplates(query) {
    let queryString = fn.queryString(query);
    return this.gethttp(`${config.templates}${queryString}`);
  }
  getTemplate(guid) {
    return this.gethttp(`${config.templates}/${guid}`);
  }
  createTemplate(template) {
    return this.post(config.templates, template);
  }
  updateTemplate(template) {
    return this.post(`${config.templates}/${template.guid}`, template).then(keys => {
      template.version = keys.version;
      return keys;
    });
  }
  deleteTemplate(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.templates}/${guid}${queryString}`);
  }
  getTemplateRevisions(guid, offsetBy, pageSize) {
    let queryString = fn.queryString({ offsetBy, pageSize });
    return this.gethttp(`${config.templates}/${guid}/revisions${queryString}`);
  }
  createTemplateRevision(guid, revision) {
    return this.post(`${config.templates}/${guid}/revisions`, revision);
  }
  getTemplateRevision(guid, createdOn) {
    return this.gethttp(`${config.templates}/${guid}/revisions/${createdOn}`);
  }
  publishTemplateRevision(guid, createdOn) {
    return this.post(`${config.templates}/${guid}/revisions/${createdOn}/publish`);
  }
  getFiles(query = {}) { 
    let queryString = fn.queryString(query);
    return this.gethttp(`${config.files}${queryString}`);
  }
  deleteFile(guid, physical) {
    let queryString = fn.queryString({ physical: physical === true });
    return this.del(`${config.files}/${guid}${queryString}`);
  }
  getFile(guid) {
    return this.gethttp(`${config.files}/${guid}`);
  }
  createFile(guid, file) {
    return this.post(`${config.files}`, file);
  }
  updateFile(guid, file) {
    return this.post(`${config.files}/${guid}`, file);
  }
  getFileRevisions(guid, query) {
    let queryString = fn.queryString(query);
    return this.gethttp(`${config.files}/${guid}/revisions${queryString}`);
  }
  getFileRevision(guid, createdOn) {
    return this.gethttp(`${config.files}/${guid}/revisions/${createdOn}`);
  }
  createFileRevision(guid, revision) {
    return this.post(`${config.files}/${guid}/revisions`, revision);
  }
  finishFileRevision(guid, createdOn) {
    return this.post(`${config.files}/${guid}/revisions/${createdOn}`);
  }
  getMasterSchedules() {
    return this.gethttp(config.masterschedule);
  }
  createMasterSchedule(schedule) {
    return this.post(config.masterschedule, schedule);
  }
  getMasterSchedule(scheduleId) {
    return this.gethttp(`${config.masterschedule}/${scheduleId}`);
  }
  updateMasterSchedule(masterschedule) {
    return this.post(`${config.masterschedule}/${masterschedule.scheduleId}`, masterschedule);
  }
  deleteMasterSchedule(scheduleId) {
    return this.del(`${config.masterschedule}/${scheduleId}`);
  }
  getOrganizations(offsetBy, pageSize) {
    let queryString = fn.queryString({ offsetBy, pageSize });
    return this.gethttp(config.organizations + queryString);
  }
  getOrganization(orgId) {
    return this.gethttp(`${config.organizations}/${orgId}`);
  }
  createOrganization(organization) {
    return this.post(config.organizations, organization);
  }
  updateOrganization(orgId, organization) {
    return this.post(`${config.organizations}/${orgId}`, organization);
  }
  deleteOrganization(orgId) {
    return this.del(`${config.organizations}/${orgId}`);
  }
  // ACCOUNTS
  createAccount(account) {
    return this.post(config.accounts, account);
  }
  getAccount(userId) {
    return this.gethttp(`${config.accounts}/${userId}`)
      .then(this.cacheParticipantName.bind(this));
  }
  updateAccount(userId, account) {
    return this.post(`${config.accounts}/${userId}`, account);
  }
  deleteAccount(userId) {
    return this.del(`${config.accounts}/${userId}`);
  }
  getAccountRequestInfo(userId) {
    return this.gethttp(`${config.accounts}/${userId}/requestInfo`);
  }
  requestAccountResetPassword(userId) {
    return this.post(`${config.accounts}/${userId}/requestResetPassword`);
  }
  resendAccountEmailVerification(userId) {
    return this.post(`${config.accounts}/${userId}/resendEmailVerification`);
  }
  resendAccountPhoneVerification(userId) {
    return this.post(`${config.accounts}/${userId}/resendPhoneVerification`);
  }
  signOutAccount(userId, deleteReauthToken) {
    return this.post(`${config.accounts}/${userId}/signOut${fn.queryString({ deleteReauthToken })}`);
  }
  updateIdentifiersForSelf(payload) {
    return this.post(config.accounts + '/self/identifiers', payload);
  }

  // ORGANIZATION MEMBERS
  getOrgMembers(orgId, search) {
    return this.post(`${config.organizations}/${orgId}/members`, search);
  }
  addOrgMember(orgId, userId) {
    return this.post(`${config.organizations}/${orgId}/members/${userId}`);
  }
  removeOrgMember(orgId, userId) {
    return this.del(`${config.organizations}/${orgId}/members/${userId}`);
  }
  // SESSION LISTENERS
  addSessionStartListener(listener) {
    if (typeof listener !== "function") {
      throw new Error(ERROR);
    }
    listeners.addEventListener(SESSION_STARTED_EVENT_KEY, listener);
  }
  addSessionEndListener(listener) {
    if (typeof listener !== "function") {
      throw new Error(ERROR);
    }
    listeners.addEventListener(SESSION_ENDED_EVENT_KEY, listener);
  }
}

export default new ServerService();
