var utils = require('./utils');

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
        return (role === "Administrator") ? "admin" : role.toLowerCase();
    });
}
function formatLanguages(value) {
    return (value) ? value.join(", ") : null;
}
function persistLanguages(value) {
    return (value) ? value.split(/\W*,\W*/) : null;
}
function persistAttributes(value) {
    return value.reduce(function(map, value) {
        map[value.key] = value.obs();
        return map;
    }, {});
}
function formatTitle(value, context) {
    return (context.model.id) ?
        formatName(context.model) :
        "New participant";
}
function formatName(value) {
    var array = [];
    if (value) {
        notBlankName(array, value.firstName);
        notBlankName(array, value.lastName);
    }
    return (array.length === 0) ? '—' : array.join(' ');
}
function maintainValue(value, context) {
    return (typeof value !== "undefined") ? value : context.oldValue;
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
function formatExternalId(value, context) {
    if (!value) {
        context.vm.externalIdEditableObs(true);
    }
    return value;
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
// For particularly difficult sub-object marshalling to the model, create a callback
// function on the observable and call that. 
function initObsCallback(value, context) {
    context.observer.callback = utils.identity;
}
function callObsCallback(value, context) {
    return context.observer.callback();
}

module.exports = {
    formatAttributes: formatAttributes,
    formatExternalId: formatExternalId,
    formatHealthCode: formatHealthCode,
    formatLanguages: formatLanguages,
    formatName: formatName,
    formatRoles: formatRoles,
    formatTitle: formatTitle,
    formatTitleCase: formatTitleCase,
    maintainValue: maintainValue,
    persistAttributes: persistAttributes,
    persistLanguages: persistLanguages,
    persistRoles: persistRoles,
    initObsCallback: initObsCallback,
    callObsCallback: callObsCallback
}
