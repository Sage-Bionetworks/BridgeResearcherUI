import fn from './functions';

function quote(a) {
    return '"'+a+'"';
}
function quotedList(array) {
    return array.map(quote).join(", ");
}
function valueForObs(criteria, field) {
    if (criteria[field+"Obs"]) {
        return criteria[field+"Obs"]();
    }
    return criteria[field];
}
function formatVersionRange(minAppVersion, maxAppVersion) {
    if (minAppVersion === 0 && maxAppVersion === 0) {
        return "never";
    } else if (minAppVersion === 0 && !fn.isNotBlank(maxAppVersion)) {
        return "always";
    } else if (fn.isNotBlank(minAppVersion) && fn.isNotBlank(maxAppVersion)) {
        return "v" + minAppVersion + "-" + maxAppVersion;
    } else if (fn.isNotBlank(minAppVersion)) {
        return "v" + minAppVersion + "+";
    } else if (fn.isNotBlank(maxAppVersion)) {
        return "v" + "0-" + maxAppVersion;
    }
    return null;
}
function label(criteria) {
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
        arr.push("'" + language + "' language");
    }
    if (allOfGroups && allOfGroups.length) {
        arr.push(quotedList(allOfGroups) + " required");
    }
    if (noneOfGroups && noneOfGroups.length) {
        arr.push(quotedList(noneOfGroups) + " prohibited");
    }
    return (arr.length) ? arr.join("; ") : "No criteria";
}
function newCriteria() {
    return {
        minAppVersions:{},
        maxAppVersions:{},
        language:null,
        allOfGroups:[],
        noneOfGroups:[]
    };
}

/**
 * Can be either a Subpopulation or a ScheduleCriteria, they share the same properties
 */
export default { label, newCriteria };
