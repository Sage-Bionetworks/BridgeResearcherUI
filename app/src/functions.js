// The only requirement for this module is that it have zero dependencies.
const SECOND = 1000;
const MINUTE = SECOND*60;
const HOUR = MINUTE*60;
const DAY = HOUR*24;
const WEEK = DAY*7;

function identity(arg) {
    return arg;
}
function is(obj, typeName) {
    return Object.prototype.toString.call(obj) === "[object "+typeName+"]";
}
function isBlank(obj) {
    return (typeof obj === "undefined") || obj === null || /^\W*$/.test(obj);
}
function isNotBlank(obj) {
    return (typeof obj !== "undefined") && obj !== null && obj !== "";
}
function seq() {
    var args = Array.prototype.slice.call(arguments);
    return function(startValue) {
        return args.reduce(function(result, func) {
            return func.call(func, result);
        }, startValue);
    };
}
function asDate(value) {
    return is(value, 'Date') ? value : new Date(value);
}
function blankInvalidDateString(string) {
    return (string === "Invalid Date") ? "" : string;
}
function formatDateString(date) {
    return date.toLocaleDateString();    
}
function formatDateTimeString(date) {
    return date.toLocaleString();    
}
function formatMs(ms) {
    if (!is(ms, "Number")) { 
        throw Error('formatMs cannot format a non-number value');
    }
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
        return string.split("").map(formatTitleElement).join('');
    }
    return defaultValue || '';
}
function queryString(object) {
    var string = "";
    if (object) {
        string = Object.keys(object).filter(function(key) { 
            return typeof object[key] !== "undefined" && object[key] !== null && object[key] !== ""; 
        }).map(function(key) { 
            return encodeURIComponent(key) + "=" + encodeURIComponent(object[key]); 
        }).join("&");
    }
    return (string) ? ("?"+string) : string;
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
function notBlankName(array, value) {
    if (typeof value !== 'undefined' && value !== '<EMPTY>' && value.length > 0) {
        array.push(value);
    }
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
// Convert date object as if it were a LocalDateTime object to the UTC timezone
function intLocalDateTimeToUTC(date) {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
}
function utcTolocalDateTime(date) {
    return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
}
function checkArgs(value) {
    if (arguments.length !== 1) { throw new Error(arguments); }
    return value;
}
function dateTimeString(date) {
    if (is(date, 'Date')) {
        return date.toISOString();
    }
    return null;
}
function makeFieldSorter(fieldName) {
    return function sorter(a,b) {

        return (a[fieldName] && b[fieldName]) ?
            a[fieldName].localeCompare(b[fieldName]) : 0;
    };
}
function handleObsUpdate(obs, fieldName) {
    return function(response) {
        obs(response[fieldName]);
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
        var fields = fieldName.split("->");
        this[fields[1]] = source[fields[0]];
    } else {
        this[fieldName] = source[fieldName];
    }
}
function handleCopyProps(target) {
    console.assert(arguments.length >= 2, "insufficient arguments to handleCopyProps");
    var args = Array.prototype.slice.call(arguments,1);
    return function(response) {
        args.forEach(function(fieldName) {
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
function copyProps(target, source) {
    console.assert(arguments.length >= 3, "insufficient arguments to copyProps");
    var args = Array.prototype.slice.call(arguments,2);
    args.forEach(function(fieldName) {
        fieldUpdater.call(target, source, fieldName);
    });
}
function returning(object) {
    return function() {
        return object;
    };
}
function isDefined(value) {
    return typeof value !== "undefined";
}
function makeFieldSorter(fieldName) {
    return function sorter(a,b) {
        if (isDefined(a[fieldName]) && isDefined(b[fieldName])) {
            return a[fieldName].localeCompare(b[fieldName]);
        }
        return 0;
    };
}
function lowerCaseStringSorter(a,b) {
    return a.localeCompare(b);
}
function log(label) {
    return function(response) {
        console.log(label, response);
        return response;
    };
}
function handleIf(bool, func, returnFuncValue) {
    return function(response) {
        if (bool) { 
            var result = func(); 
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
    if (is(object, 'Array')) {
        for (var i=0; i < object.length; i++) {
            deleteUnusedProperties(object[i]);
        }
    } else if (is(object, 'Object')) {
        for (var prop in object) {
            if (typeof object[prop] === 'undefined' || object[prop] === "" || object[prop] === null) {
                delete object[prop];
            } else {
                deleteUnusedProperties(object[prop]);
            }
        }
    }
}
// Append a number to the string, intelligently incrementing if a number already exists there.
function incrementNumber(string) {
    if (is(string, 'String')) {
        var digits = 0, match = /(\d+$)/.exec(string);
        if (match) {
            digits = parseInt(match[0]);
            string = string.substring(0,string.length-(match[0].length));
        }
        string = string + (digits+1);
    }
    return string;
}
function pad(num) {
    var norm = Math.abs(Math.floor(num));
    return (norm < 10 ? '0' : '') + norm;
}
function dateToLocalISOString(date, timePortion) {
    var tzo = -date.getTimezoneOffset();
    var dif = tzo >= 0 ? '+' : '-';
    var str = date.getFullYear()+'-'+pad(date.getMonth() + 1)+'-'+pad(date.getDate())+'T';
    if (timePortion) {
        str += timePortion;
    } else {
        str += pad(date.getHours())+':'+pad(date.getMinutes())+':'+pad(date.getSeconds());
    }
    str += dif + pad(tzo / 60) + ':' + pad(tzo % 60);
    return str;
}
function arrayContains(array, value) {
    return array.indexOf(value) > -1;
}

var formatDate = seq(checkArgs, asDate, formatDateString, blankInvalidDateString);
var formatDateTime = seq(checkArgs, asDate, formatDateTimeString, blankInvalidDateString);
var localDateTimeToUTC = seq(asDate, intLocalDateTimeToUTC);

export default {
    arrayContains,
    asDate,
    copyProps,
    dateTimeString,
    dateToLocalISOString,
    deleteUnusedProperties,
    formatDate,
    formatDateTime,
    formatLanguages,
    formatMs,
    formatName,
    formatRoles,
    formatTitleCase,
    formatVersionRange,
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
    localDateTimeToUTC,
    log,
    lowerCaseStringSorter,
    makeFieldSorter,
    persistLanguages,
    persistRoles,
    queryString,
    returning,
    seq,
    utcTolocalDateTime
};
