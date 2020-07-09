import fn from "./functions";

function quote(a) {
  return '"' + a + '"';
}
function quotedList(array) {
  return fn.formatList(array.map(quote));
}
function valueForObs(criteria, field) {
  if (criteria[field + "Obs"]) {
    return criteria[field + "Obs"]();
  }
  return criteria[field];
}
function formatVersionRange(minAppVersion, maxAppVersion) {
  if (minAppVersion === 0 && maxAppVersion === 0) {
    return "never";
  } else if (fn.isNotBlank(minAppVersion) && fn.isNotBlank(maxAppVersion)) {
    return "v" + minAppVersion + "-" + maxAppVersion;
  } else if (fn.isNotBlank(minAppVersion) && minAppVersion > 0) {
    return "v" + minAppVersion + "+";
  } else if (fn.isNotBlank(maxAppVersion)) {
    return "v" + "0-" + maxAppVersion;
  }
  return null;
}
function label(criteria) {
  if (!criteria) { return ''; } // wait until loaded.
  // These properties don't necessarily exist, which throws reference errors. So init them.
  criteria.minAppVersions = criteria.minAppVersions || {};
  criteria.maxAppVersions = criteria.maxAppVersions || {};
  let iosMin = valueForObs(criteria.minAppVersions, "iPhone OS");
  let iosMax = valueForObs(criteria.maxAppVersions, "iPhone OS");
  let androidMin = valueForObs(criteria.minAppVersions, "Android");
  let androidMax = valueForObs(criteria.maxAppVersions, "Android");
  let language = valueForObs(criteria, "language");
  let allOfGroups = valueForObs(criteria, "allOfGroups");
  let noneOfGroups = valueForObs(criteria, "noneOfGroups");
  let allOfStudyIds = valueForObs(criteria, "allOfStudyIds");
  let noneOfStudyIds = valueForObs(criteria, "noneOfStudyIds");
  let iosRange = formatVersionRange(iosMin, iosMax);
  let androidRange = formatVersionRange(androidMin, androidMax);

  let arr = [];
  if (iosRange !== null && iosRange === androidRange) {
    arr.push(iosRange);
  } else {
    if (iosRange !== null) {
      arr.push(iosRange + " (on iOS)");
    }
    if (androidRange !== null) {
      arr.push(androidRange + " (on Android)");
    }
  }
  if (fn.isNotBlank(language)) {
    arr.push('"' + language + '" language');
  }
  if (allOfGroups && allOfGroups.length) {
    let str = (allOfGroups.length > 1) ? "data groups are" : "data group is";
    arr.push(`${quotedList(allOfGroups)} ${str} required`);
  }
  if (noneOfGroups && noneOfGroups.length) {
    let str = (noneOfGroups.length > 1) ? "data groups are" : "data group is";
    arr.push(`${quotedList(noneOfGroups)} ${str} prohibited`);
  }
  if (allOfStudyIds && allOfStudyIds.length) {
    let str = (allOfStudyIds.length > 1) ? "study memberships are" : "study membership is";
    arr.push(`${quotedList(allOfStudyIds)} ${str} required`);
  }
  if (noneOfStudyIds && noneOfStudyIds.length) {
    let str = (noneOfStudyIds.length > 1) ? "study memberships are" : "study membership is";
    arr.push(`${quotedList(noneOfStudyIds)} ${str} prohibited`);
  }
  return arr.length ? arr.join("; ") : "No criteria";
}
function newCriteria() {
  return {
    minAppVersions: {},
    maxAppVersions: {},
    language: null,
    allOfGroups: [],
    noneOfGroups: []
  };
}

/**
 * Can be either a Subpopulation or a ScheduleCriteria, they share the same properties
 */
export default { label, newCriteria };
