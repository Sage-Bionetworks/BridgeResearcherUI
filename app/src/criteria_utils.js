var utils = require('./utils');

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
    if (utils.isNotBlank(minAppVersion) && utils.isNotBlank(maxAppVersion)) {
        return "v" + minAppVersion + "-" + maxAppVersion;
    } else if (utils.isNotBlank(minAppVersion)) {
        return "v" + minAppVersion + "+";
    } else if (utils.isNotBlank(maxAppVersion)) {
        return "v" + "0-" + maxAppVersion;
    }
    return null;
}
function label(criteria) {
    // These properties don't necessarily exist, which throws reference errors. So init them.
    criteria.minAppVersions = criteria.minAppVersions || {};
    criteria.maxAppVersions = criteria.maxAppVersions || {};
    var iosMin = valueForObs(criteria.minAppVersions, "iphone_os");
    var iosMax = valueForObs(criteria.maxAppVersions, "iphone_os");
    var androidMin = valueForObs(criteria.minAppVersions, "android");
    var androidMax = valueForObs(criteria.maxAppVersions, "android");
    var language = valueForObs(criteria, "language");
    var allOfGroups = valueForObs(criteria, "allOfGroups");
    var noneOfGroups = valueForObs(criteria, "noneOfGroups");
    var iosRange = formatVersionRange(iosMin, iosMax);
    var androidRange = formatVersionRange(androidMin, androidMax);

    var arr = [];
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
    if (utils.isNotBlank(language)) {
        arr.push("'" + language + "' language");
    }
    if (allOfGroups.length) {
        arr.push(quotedList(allOfGroups) + " required");
    }
    if (noneOfGroups.length) {
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
module.exports = {
    label: label,
    newCriteria: newCriteria
};
