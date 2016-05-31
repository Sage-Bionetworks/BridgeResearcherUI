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
function label(criteria) {
    var minAppVersion = valueForObs(criteria, "minAppVersion");
    var maxAppVersion = valueForObs(criteria, "maxAppVersion");
    var language = valueForObs(criteria, "language");
    var allOfGroups = valueForObs(criteria, "allOfGroups");
    var noneOfGroups = valueForObs(criteria, "noneOfGroups");

    var arr = [];
    if (utils.isNotBlank(minAppVersion) && utils.isNotBlank(maxAppVersion)) {
        arr.push("v" + minAppVersion + "-" + maxAppVersion);
    } else if (utils.isNotBlank(minAppVersion)) {
        arr.push("v" + minAppVersion + "+");
    } else if (utils.isNotBlank(maxAppVersion)) {
        arr.push("v" + "0-" + maxAppVersion);
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
        minAppVersion:null,
        maxAppVersion:null,
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
