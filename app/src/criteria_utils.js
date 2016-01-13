var utils = require('./utils');

function getAppVersions(minValue, maxValue) {
    if (utils.isDefined(minValue) && utils.isDefined(maxValue)) {
        return "Versions " + minValue + "-" + maxValue;
    } else if (utils.isDefined(minValue)) {
        return "Versions " + minValue + "+";
    } else if (utils.isDefined(maxValue)) {
        return "Versions " + "0-" + maxValue;
    }
    return "<i>All versions</i>";
}
function quote(a) {
    return '"'+a+'"';
}
function quotedList(array) {
    return array.map(quote).join(", ");
}
function arrayDefined(obj, prop) {
    return obj[prop] && obj[prop].length;
}
function label(criteria) {
    var arr = [];
    arr.push(getAppVersions(criteria.minAppVersion, criteria.maxAppVersion));
    if (arrayDefined(criteria, "allOfGroups")) {
        arr.push("user must be in data group(s) " + quotedList(criteria.allOfGroups));
    }
    if (arrayDefined(criteria, "noneOfGroups")) {
        arr.push("user cannot be in data group(s) " + quotedList(criteria.noneOfGroups));
    }
    return arr.join("; ");
}

/**
 * Can be either a Subpopulation or a ScheduleCriteria, they share the same properties
 */
module.exports = {
    label: label
}


