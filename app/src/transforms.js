function isBlank(obj) {
    return (typeof obj === "undefined") || obj === null || obj === "";
}
function is(obj, typeName) {
    return Object.prototype.toString.call(obj) === "[object "+typeName+"]";
}
function notBlankName(array, value) {
    if (typeof value !== 'undefined' && value !== '<EMPTY>' && value.length > 0) {
        array.push(value);
    }
}
function formatRoles(roles) {
    return (roles || []).map(function(role) {
        return (role === "admin") ? "Administrator" : formatTitleCase(role);
    });
}
function persistRoles(roles) {
    return (roles || []).map(function(role) {
        return (role === "Administrator") ? "admin" : role.toLowerCase().replace(" ","_");
    });
}
function formatLanguages(value) {
    return (value) ? value.join(", ") : '';
}
function persistLanguages(value) {
    return (value) ? value.split(/\W*,\W*/).map(function(value) {
        return value.trim(); 
    }).filter(function(value) {
        return value.length > 0;
    }) : null;
}
function persistAttributes(value) {
    return value.reduce(function(map, value) {
        map[value.key] = value.obs();
        return map;
    }, {});
}
function nameIsBlank(model) {
    return isBlank(model.firstName) && isBlank(model.lastName);
}
function formatTitle(value, context) {
    if (context.model.id === "new" && nameIsBlank(context.model)) {
        return "New participant";
    }
    return formatName(context.model);
}
function formatName(participant) {
    var array = [];
    if (participant) {
        notBlankName(array, participant.firstName);
        notBlankName(array, participant.lastName);
        if (array.length === 0 && participant.email) {
            return participant.email;
        }
    }
    return (array.length === 0) ? '—' : array.join(' ');
}
function formatAttributes(value, context) {
    context.vm.attributesObs().map(function(attr) {
        attr.obs(value[attr.key]);
    });
    return context.vm.attributesObs();
}
function formatHealthCode(value, context) {
    return (context.vm.study.healthCodeExportEnabled) ? value : 'N/A';
}
function formatTitleCase(string, defaultValue) {
    if (string) {
        return string.split("").map(function(text, i) {
            if (i === 0) {
                return text.toUpperCase();
            } else if (!/[a-zA-Z0-9]/.test(text)) {
                return " ";
            } else if (/[A-Z]/.test(text)) {
                return " " + text.toLowerCase();
            }
            return text.toLowerCase();
        }).join('');
    }
    return defaultValue || '';
}
function callObsCallback(value, context) {
    return context.observer.callback();
}
/**
 * Convert an ISO date string to a browser-dependent, local date string. 
 * This date string preserves the time zone of the user, adjusting the time of an 
 * absolute event.
 */
function formatLocalDateTime(date) {
    var result = dateOrDefault(date, "");
    return (result.isDate) ? result.value.toLocaleString() : result.value;
}

/**
 * Convert a ISO date string ("2010-01-01") to a browser-dependent, local date string, 
 * adjusting for the time zone offset on that date, to compensate for the fact that a 
 * date without a time is abstract and not expressed relative to a time zone. Otherwise 
 * the browser may shift the date to a different day when it localizes the time zone.
 */
function formatLocalDateWithoutZone(input) {
    var result = dateOrDefault(input, "");
    return (result.isDate) ? result.value.split(" @ ")[0] : result.value; 
}

function truncateGUID(guid) {
    return guid.split("-")[0];
}

function formatLocalDateTimeWithoutZone(input) {
    var result = dateOrDefault(input, "");
    if (result.isDate) {
        var components = result.value.toISOString().split("T");
        var time = components[1].split(/[Z+-]/)[0];
        time = time.replace(/:\d{2,2}\.\d{3,3}$/,'');
        var date = components[0];
        var offset = new Date(result.value).toString().match(/GMT([^\s]*)/)[1];
        offset = offset.replace(/00$/,":00");
        var localDate = date + "T" + time + offset;
        return new Date(localDate).toLocaleDateString() + " @ " + time;
    }
    return result.value;
}


function dateOrDefault(input, defaultValue) {
    var rightType = is(input, 'Date') || is(input, 'String');
    if (rightType && !isBlank(input)) {
        var date = new Date(input);
        if (date.toString() !== 'Invalid Date') {
            return {value: date, isDate: true};
        }
    }
    return {value: defaultValue, isDate: false};
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

var SECOND = 1000;
var MINUTE = SECOND*60;
var HOUR = MINUTE*60;
var DAY = HOUR*24;
var WEEK = DAY*7;

function formatMs(ms) {
    if (ms < MINUTE) {
        var s = Math.floor(ms/SECOND);
        return s + "s";
    } else if (ms < HOUR) {
        var m = Math.floor(ms/MINUTE);
        return m + "m " + formatMs(ms%MINUTE);
    } else if (ms < DAY) {
        var h = Math.floor(ms/HOUR);
        return h + "h " + formatMs(ms%HOUR);
    } else if (ms < WEEK) {
        var d = Math.floor(ms/DAY);
        return d + "d " + formatMs(ms%DAY);
    } else {
        var w = Math.floor(ms/WEEK);
        return w + "w " + formatMs(ms%WEEK);
    }
}
function queryString(object) {
    var string = Object.keys(object).filter(function(key) { 
        return typeof object[key] !== "undefined" && object[key] !== null && object[key] !== ""; 
    }).map(function(key) { 
        return encodeURIComponent(key) + "=" + encodeURIComponent(object[key]); 
    }).join("&");
    return (string) ? ("?"+string) : "";
}

module.exports = {
    formatAttributes: formatAttributes,
    formatHealthCode: formatHealthCode,
    formatLanguages: formatLanguages,
    formatName: formatName,
    formatRoles: formatRoles,
    formatTitle: formatTitle,
    formatTitleCase: formatTitleCase,
    formatLocalDateTime: formatLocalDateTime,
    formatVersionRange: formatVersionRange,
    formatLocalDateWithoutZone: formatLocalDateWithoutZone,
    formatLocalDateTimeWithoutZone: formatLocalDateTimeWithoutZone,
    persistAttributes: persistAttributes,
    persistLanguages: persistLanguages,
    persistRoles: persistRoles,
    callObsCallback: callObsCallback,
    formatMs: formatMs,
    truncateGUID: truncateGUID,
    queryString: queryString
};
