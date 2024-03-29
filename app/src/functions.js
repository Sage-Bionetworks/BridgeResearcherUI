// The only requirement for this module is that it have zero dependencies.
const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

const SUPPORTED_COUNTRIES = [
  {regionCode: 'US', flag: '🇺🇸', name: 'United States'},
  {regionCode: 'CA', flag: '🇨🇦', name: 'Canada'},
  {regionCode: 'IN', flag: '🇮🇳', name: 'India'},
  {regionCode: 'MX', flag: '🇲🇽', name: 'Mexico'},
  {regionCode: 'NL', flag: '🇳🇱', name: 'Netherlands'},
  {regionCode: 'NG', flag: '🇳🇬', name: 'Nigeria'},
  {regionCode: 'GB', flag: '🇬🇧', name: 'United Kingdom'},
];

const LOCAL_TIMEZONE = Date()
  .split("(")[1]
  .split(")")[0]
  .replace(/[^A-Z]/g, "");
const IS_BROWSER = typeof window !== "undefined" && typeof window.document !== "undefined";
const BYTE_UNITS = [' KB', ' MB', ' GB', ' TB'];
const FORMAT = new Intl.NumberFormat();
const ISO_DURATION = /(-)?P(\d*W)?(\d*D)?T?(\d+H)?(\d+M)?/;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDuration(duration) {
    let matches = duration.match(ISO_DURATION);
    let parsed = {
        negative: matches[1] === undefined ? false : true,
        weeks: matches[2] === undefined ? 0 : parseInt(matches[2]),
        days: matches[3] === undefined ? 0 : parseInt(matches[3]),
        hours: matches[4] === undefined ? 0 : parseInt(matches[4]),
        minutes: matches[5] === undefined ? 0 : parseInt(matches[5])
    };
    let totalDays = (parsed.weeks*7) + parsed.days + ((parsed.hours + parsed.minutes/60)/24);
    parsed.totalDays = parsed.negative ? -Math.floor(totalDays) : Math.floor(totalDays);
    return parsed;
};

function formatField(array, value, field) {
  if (value > 0) {
    if (value === 1) {
      array.push(value + ' ' + field);
    } else {
      array.push(value + ' ' + field + 's');
    }
  }
}

function formatDuration(duration) {
  if (!duration) {
    return '';
  }
  let d = parseDuration(duration);
  let array = [];
  formatField(array, d.weeks, 'wk');
  formatField(array, d.days, 'day');
  formatField(array, d.hours, 'hr');
  formatField(array, d.minutes, 'min');
  return array.join(', ');
}

function daysSince(timestamp, now = new Date()) {
  let start = new Date(timestamp);
  let end = now;
  // Set to noon to avoid DST errors, probably
  start.setHours(12, 0, 0);
  end.setHours(12, 0, 0);
  // Round to remove daylight saving errors, probably
  return Math.round( (end - start) / MS_PER_DAY );
}
function formatDaysSince(timestamp, now = new Date()) {
  let result = daysSince(timestamp, now);
  return result >= 0 ? result : ''; 
}

function canEditAssessment(assessment, session) {
  if (assessment.ownerId.indexOf(':') > -1) {
    var [appId, orgId] = assessment.ownerId.split(':');
  } else {
    var appId = session.appId;
    var orgId = assessment.ownerId;
  }
  return session.roles.indexOf('superadmin') > -1 || 
    (session.roles.indexOf('study_designer') > -1 && session.appId === appId && session.orgMembership === orgId) ||
    (session.roles.indexOf('developer') > -1 && session.appId === appId);
}
function flagForRegionCode(regionCode) {
  let entries = SUPPORTED_COUNTRIES.filter(entry => entry.regionCode === regionCode);
  return (entries.length) ? entries[0].flag : '';
}
function identity(arg) {
  return arg;
}
function is(obj, typeName) {
  return Object.prototype.toString.call(obj) === "[object " + typeName + "]";
}
function isBlank(obj) {
  return typeof obj === "undefined" || obj === null || /^\W*$/.test(obj);
}
function isNotBlank(obj) {
  return typeof obj !== "undefined" && obj !== null && obj !== "";
}
function seq(...funcs) {
  return function(startValue) {
    return funcs.reduce(function(result, func) {
      return func.call(func, result);
    }, startValue);
  };
}
function formatMs(ms) {
  if (!is(ms, "Number")) {
    throw Error("formatMs cannot format a non-number value: " + ms);
  }
  if (ms < MINUTE) {
    let s = Math.floor(ms / SECOND);
    return s + "s";
  } else if (ms < HOUR) {
    let m = Math.floor(ms / MINUTE);
    return m + "m " + formatMs(ms % MINUTE);
  } else if (ms < DAY) {
    let h = Math.floor(ms / HOUR);
    return h + "h " + formatMs(ms % HOUR);
  } else if (ms < WEEK) {
    let d = Math.floor(ms / DAY);
    return d + "d " + formatMs(ms % DAY);
  } else {
    let w = Math.floor(ms / WEEK);
    return w + "w " + formatMs(ms % WEEK);
  }
}
function formatTitleElement(text, i) {
  if (i === 0) {
    return text.toUpperCase();
  } else if (!/[a-zA-Z0-9]/.test(text)) {
    return " ";
  } else if (/[A-Z]/.test(text)) {
    return " " + text.toLowerCase();
  }
  return text.toLowerCase();
}
function formatTitleCase(string, defaultValue) {
  if (string) {
    return string
      .split("")
      .map(formatTitleElement)
      .join("");
  }
  return defaultValue || "";
}
function queryString(object, prefix) {
  let ns = prefix ? prefix + "." : "";
  let query = new URLSearchParams();
  if (object) {
    let keyFilter = (key) => typeof object[key] !== "undefined" && object[key] !== null && object[key] !== "";
    Object.keys(object).filter(keyFilter).forEach((key) => {
      let finalKey = ns + key;
      if (isDate(object[key])) {
        query.append(finalKey, object[key].toISOString());
      } else if (Array.isArray(object[key])) {
        for (var i = 0; i < object[key].length; i++) {
          query.append(finalKey, object[key][i]);
        }
      } else {
        query.append(finalKey, object[key]);
      }
    });
  }
  return query.toString() ? ('?' + query.toString()) : '';
}
function queryToObject(query, arrayPropertyNames, prefix) {
  let obj = {};
  let ns = prefix ? prefix + "." : "";
  query.replace(/^\?/, "").split("&").forEach(function(pair) {
    let [key, value] = pair.split("=").map(value => decodeURIComponent(value));
    if (key.startsWith(ns)) {
      if (ns !== "") {
        key = key.split(ns)[1];
      }
      if (obj[key] && Array.isArray(obj[key])) {
        obj[key].push(convertValue(value));
      } else if (obj[key]) {
        obj[key] = [obj[key], convertValue(value)];
      } else if (arrayPropertyNames.includes(key)) {
        obj[key] = [convertValue(value)];
      } else {
        obj[key] = convertValue(value);
      }
    }
  });
  return obj;
}
function convertValue(value) {
  if (value === "true" || value === "false") {
    return value === "true";
  } else if (/^\d+$/.test(value)) {
    return parseInt(value);
  }
  return value;
}
function formatVersionRange(minValue, maxValue) {
  if (!isBlank(minValue) && !isBlank(maxValue)) {
    return minValue + "-" + maxValue;
  } else if (!isBlank(minValue)) {
    return minValue + "+";
  } else if (!isBlank(maxValue)) {
    return "0-" + maxValue;
  }
  return "<i>All versions</i>";
}
function formatYearMonth(year, month) {
  if (year && month) {
    return new Date(year, month, 0, 0, 0, 0, 0).toISOString().split(/(\d{4}-\d{2})/)[1];
  }
  return null;
}
function formatLanguages(value) {
  return value ? value.join(", ") : "";
}
function persistLanguages(value) {
  return value ? value .split(/\W*,\W*/) .map(function(value) {
    return value.trim();
  }).filter(function(value) {
    return value.length > 0;
  }) :
  null;
}
function formatRoles(roles) {
  return (roles || []).map(function(role) {
    if (role === "admin") {
      return "Administrator";
    } else if (role === "study_coordinator") {
      return "Study Coordinator";
    } else if (role === "study_designer") {
      return "Study Designer";
    } else if (role === "org_admin") {
      return "Organization Administrator";
    }
    return formatTitleCase(role);
  });
}
function persistRoles(roles) {
  return (roles || []).map(function(role) {
    if (role === "Administrator") {
      return "admin";
    } else if (role === "Study Coordinator") {
      return "study_coordinator";
    } else if (role === "Study Designer") {
      return "study_designer";
    } else if (role === "Organization Administrator") {
      return "org_admin";
    }
    return role.toLowerCase().replace(" ", "");
  });
}
function notBlankName(array, value) {
  if (typeof value !== "undefined" && value !== "<EMPTY>" && value.length > 0) {
    array.push(value);
  }
}
function formatSentenceCase(string) {
  return string.substring(0, 1).toUpperCase() + string.substring(1);
}
function formatName(participant) {
  let array = [];
  if (participant) {
    notBlankName(array, participant.firstName);
    notBlankName(array, participant.lastName);
  }
  return array.length === 0 ? "—" : array.join(" ");
}
function formatNameAsFullLabel(summary, studyId) {
  let name = formatName(summary);
  if (name !== "—") {
    return name;
  }
  if (summary.email) {
    if (summary.email.includes(summary.externalId)) {
      name = summary.externalId;
    } else if (name === "—") {
      name = summary.email;
    }
  } else if (summary.phone) {
    if (summary.phone.nationalFormat) {
      name = summary.phone.nationalFormat;
    } else if (summary.phone.number) {
      name = summary.phone.number;
    } else {
      name = summary.phone;
    }
  } else if (summary.externalIds && (summary.externalIds.length || Object.keys(summary.externalIds).length)) {
    if (studyId) {
      name = summary.externalIds[studyId] || summary.id;
    } else {
      name = Object.values(summary.externalIds).join(', ');
    }
  } else if (summary.externalId) {
    name = summary.externalId;
  } else if (summary.synapseUserId) {
    name = 'Synapse ID ' + summary.synapseUserId;
  } else if (summary.id) {
    name = summary.id;
  } else if (summary.identifier) {
    name = summary.identifier;
  }
  return name;
}
function handleObsUpdate(obs, fieldName) {
  return function(response) {
    obs(response[fieldName]);
    return response;
  };
}
function handleConditionalObsUpdate(object, fieldName) {
  return function(response) {
    if (response[fieldName]) {
      object(response[fieldName]);
    }
    return response;
  };
}
function handleStaticObsUpdate(obs, value) {
  return function(response) {
    obs(value);
    return response;
  };
}
function handleForEach(fieldName, func) {
  return function(response) {
    response[fieldName].forEach(func);
    return response;
  };
}
function fieldUpdater(source, fieldName) {
  if (fieldName.indexOf("->") > -1) {
    let fields = fieldName.split("->");
    this[fields[1]] = source[fields[0]];
  } else {
    this[fieldName] = source[fieldName];
  }
}
function handleCopyProps(target, ...fieldNames) {
  return function(response) {
    fieldNames.forEach(function(fieldName) {
      fieldUpdater.call(target, response, fieldName);
    });
    return response;
  };
}
function handleSort(fieldName, sortField, reverse) {
  return function(response) {
    response[fieldName].sort(makeFieldSorter(sortField));
    if (reverse) {
      response[fieldName].reverse();
    }
    return response;
  };
}
function handleMap(fieldName, func) {
  return function(response) {
    response[fieldName] = response[fieldName].map(func);
    return response;
  };
}
function copyProps(target, source, ...fieldNames) {
  fieldNames.forEach(function(fieldName) {
    fieldUpdater.call(target, source, fieldName);
  });
}
function moveArrayItem(array, from, to) {
  array.splice(to, 0, array.splice(from, 1)[0]);
  return array;
}
function returning(object) {
  return function() {
    return object;
  };
}
function isDefined(value) {
  return typeof value !== "undefined";
}
function isDate(value) {
  return Object.prototype.toString.call(value) === "[object Date]";
}
function makeFieldSorter(fieldName) {
  return function sorter(a, b) {
    if (isDefined(a[fieldName]) && isDefined(b[fieldName])) {
      return a[fieldName].localeCompare(b[fieldName]);
    }
    return 0;
  };
}
function lowerCaseStringSorter(a, b) {
  return a.localeCompare(b);
}
function log(label) {
  return function(response) {
    return response;
  };
}
function handleIf(bool, func, returnFuncValue) {
  return function(response) {
    if (bool) {
      let result = func();
      if (returnFuncValue) {
        return result;
      }
    }
    return response;
  };
}
function handlePromise(func) {
  return function(arg) {
    return func(arg);
  };
}
function handleReverse(property) {
  return function(response) {
    response[property].reverse();
    return response;
  };
}
function deleteUnusedProperties(object) {
  if (is(object, "Array")) {
    for (let i = 0; i < object.length; i++) {
      deleteUnusedProperties(object[i]);
    }
  } else if (is(object, "Object")) {
    for (let prop in object) {
      if (isBlank(object[prop])) {
        delete object[prop];
      } else {
        deleteUnusedProperties(object[prop]);
      }
    }
  }
}
// Append a number to the string, intelligently incrementing if a number already exists there.
function incrementNumber(string) {
  if (is(string, "String")) {
    let digits = 0,
      match = /(\d+$)/.exec(string);
    if (match) {
      digits = parseInt(match[0]);
      string = string.substring(0, string.length - match[0].length);
    }
    string = string + (digits + 1);
  }
  return string;
}
function pad(num) {
  let norm = Math.abs(Math.floor(num));
  return (norm < 10 ? "0" : "") + norm;
}
function formatList(array = [], finalWord = "and", separator = ",") {
  if (is(array, "Array") && array.length) {
    if (array.length === 1) {
      return array[0];
    } else if (array.length === 2) {
      return `${array[0]} ${finalWord} ${array[1]}`;
    } else {
      let middle = array.slice(1, array.length - 1).join(`${separator} `);
      return `${array[0]}${separator} ${middle}${separator} ${finalWord} ${array[array.length - 1]}`;
    }
  }
  return "";
}
function formatSearch(search) {
  if (!search) {
    return "";
  }
  let array = [];
  if (search.emailFilter) {
    array.push(`email matches “${search.emailFilter}”`);
  }
  if (search.phoneFilter) {
    array.push(`phone matches “${search.phoneFilter}”`);
  }
  if (search.externalIdFilter) {
    array.push(`external ID matches “${search.externalIdFilter}”`);
  }
  if (search.language) {
    array.push(`languages include “${search.language}”`);
  }
  if (search.allOfGroups.length) {
    array.push(`data groups include ${formatList(search.allOfGroups.map(s => `“${s}”`))}`);
  }
  if (search.noneOfGroups.length) {
    array.push(`data groups exclude ${formatList(search.noneOfGroups.map(s => `“${s}”`))}`);
  }
  if (search.startTime && search.endTime) {
    array.push(`account was created from ${formatDate(search.startTime)} to ${formatDate(search.endTime)}`);
  } else if (search.startTime) {
    array.push(`account was created on or after ${formatDate(search.startTime)}`);
  } else if (search.endTime) {
    array.push(`account was created on or before ${formatDate(search.endTime)}`);
  }
  if (search.status) {
    array.push(`status is ${search.status}`);
  }
  if (search.enrollment === 'withdrawn') {
    array.push('account is withdrawn');
  } else if (search.enrollment === 'enrolled') {
    array.push('account is actively enrolled');
  }
  if (search.attributeKey && search.attributeValueFilter) {
    array.push(`attribute ${search.attributeKey} matches “${search.attributeValueFilter}”`);
  }
  // when returned as a requestParam, this is not a string
  if (typeof search.inUse !== 'undefined') {
    if (search.inUse) {
      array.push(`account is in use`);
    } else {
      array.push(`account is not in use`);
    }
  }
  if (array.length) {
    return "Search for accounts where " + formatList(array, "and", ";");
  }
  return "Search for all accounts";
}
function studyMatchesUser(userStudies, studyId) {
  return userStudies.length === 0 || userStudies.includes(studyId);
}

function formatFileSize(fileSize) {
  if (!fileSize) {
    return '—';
  }
  var i = -1;
  do {
      fileSize = fileSize / 1024;
      i++;
  } while (fileSize > 1024);
  return Math.max(fileSize, 0.1).toFixed(1) + BYTE_UNITS[i];
}
function formatParticipantLabel(item, studyId) {
  let name = [];
  notBlankName(name, item.firstName);
  notBlankName(name, item.lastName);
  let array = [];
  if (item.email) {
    array.push(item.email);
  }
  if (item.phone) {
    if (typeof item.phone === 'string') {
      array.push(item.phone);
    } else {
      array.push(flagForRegionCode(item.phone.regionCode) + " " + item.phone.nationalFormat);
    }
  }
  if (studyId) {
    if (item.externalIds[studyId]) {
      array.push(item.externalIds[studyId]);
    }
  } else {
    let arrays = Object.values(item.externalIds || []);
    if (arrays.length) {
      array.push(arrays.join(", "));
    }
  }
  if (item.synapseUserId) {
    array.push('synID ' + item.synapseUserId);
  }
  if (name.length > 0 && array.length > 0) {
    return name.join(' ') + ' &bull; ' + array.join(" &bull; ");
  } else if (name.length === 0) {
    return array.join(" &bull; ");
  } else if (array.length == 0) {
    return name.join(' '); 
  }
  return "—";
}
function formatEventId(eventId) {
  if (eventId.startsWith("study_burst:")) {
    var parts = eventId.split(":");
    return parts[1] + " #" + parseInt(parts[2]);
  } else if (eventId.startsWith("custom:")) {
    return eventId.substring(7);
  }
  return eventId;
}

/* ==================================== DATE FUNCTIONS ==================================== */

function _asDate(value) {
  if (is(value, "Date")) {
    return value;
  }
  try {
    // casting to string detects breaks on values such as null
    return new Date(value.toString());
  } catch (e) {
    // Really? We just make up a date?
    return new Date();
  }
}

function _format(format) {
  if (DATE_TIME[format]) {
    return format;
  }
  return IS_BROWSER ? localStorage.getItem("timezone") || "iso" : "iso";
}
const DATE_TIME = {
  local: formatDateTimeLocal,
  gmt: formatDateTimeGMT,
  iso: formatDateTimeISO
};
const DATE = {
  local: formatDateLocal,
  gmt: formatDateGMT,
  iso: formatDateISO
};
const TIME = {
  local: formatTimeLocal,
  gmt: formatTimeGMT,
  iso: formatTimeISO
};

function getRangeInDays(deltaPast, deltaFuture) {
  let start = new Date();
  start.setDate(start.getDate() + deltaPast);
  let end = new Date();
  end.setDate(end.getDate() + deltaFuture);
  return { start, end };
}
function formatDateTime(date, format) {
  if (!date) { return ''; }
  return DATE_TIME[_format(format)](date);
}
function formatDate(date, format) {
  if (!date) { return ''; }
  return DATE[_format(format)](date);
}
function formatTime(date, format) {
  if (!date) { return ''; }
  return TIME[_format(format)](date);
}

function formatDateTimeLocal(date) {
  return _asDate(date).toLocaleString() + " " + LOCAL_TIMEZONE;
}
function formatDateLocal(date) {
  return _asDate(date).toLocaleDateString() + " " + LOCAL_TIMEZONE;
}
function formatTimeLocal(date) {
  return _asDate(date).toLocaleTimeString();
}

function formatDateTimeGMT(date) {
  return _asDate(date)
    .toUTCString()
    .substring(5);
}
function formatDateGMT(date) {
  return _asDate(date)
    .toUTCString()
    .substring(5)
    .split(/(\d{4})/)
    .slice(0, 2)
    .join("");
}
function formatTimeGMT(date) {
  return _asDate(date)
    .toUTCString()
    .substring(5)
    .split(/(\d{4})/)[2]
    .split(" ")[1];
}

function formatDateTimeISO(date) {
  if (typeof date === "string") return date;
  return _asDate(date).toISOString();
}
function formatDateISO(date) {
  return _asDate(date)
    .toISOString()
    .split("T")[0];
}
function formatTimeISO(date) {
  return _asDate(date)
    .toISOString()
    .split("T")[1]
    .split(".")[0];
}
function formatCount(count = '') {
  if (typeof count === 'number') {
    if (count < 1) {
      return 'No records';
    }
    let plural = count > 1 ? ' records' : ' record';
    return FORMAT.format(count) + plural;
  }
  return count;
}

export default {
  canEditAssessment,
  copyProps,
  daysSince,
  deleteUnusedProperties,
  flagForRegionCode,
  formatCount,
  formatDate,
  formatDateTime,
  formatDaysSince,
  formatDuration,
  formatEventId,
  formatFileSize,
  formatTime,
  formatLanguages,
  formatList,
  formatMs,
  formatName,
  formatNameAsFullLabel,
  formatParticipantLabel,
  formatRoles,
  formatSearch,
  formatSentenceCase,
  formatTitleCase,
  formatVersionRange,
  formatYearMonth,
  getRangeInDays,
  handleConditionalObsUpdate,
  handleCopyProps,
  handleForEach,
  handleIf,
  handleMap,
  handleObsUpdate,
  handlePromise,
  handleReverse,
  handleSort,
  handleStaticObsUpdate,
  identity,
  incrementNumber,
  is,
  isBlank,
  isDefined,
  isNotBlank,
  log,
  lowerCaseStringSorter,
  makeFieldSorter,
  moveArrayItem,
  parseDuration,
  persistLanguages,
  persistRoles,
  queryString,
  queryToObject,
  returning,
  seq,
  studyMatchesUser,
  SUPPORTED_COUNTRIES
};
