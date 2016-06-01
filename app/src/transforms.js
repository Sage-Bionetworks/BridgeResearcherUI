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
function formatTitle(value, context) {
    if (typeof context.model === "undefined" || context.model.id === "new") {
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

module.exports = {
    formatAttributes: formatAttributes,
    formatHealthCode: formatHealthCode,
    formatLanguages: formatLanguages,
    formatName: formatName,
    formatRoles: formatRoles,
    formatTitle: formatTitle,
    formatTitleCase: formatTitleCase,
    persistAttributes: persistAttributes,
    persistLanguages: persistLanguages,
    persistRoles: persistRoles,
    callObsCallback: callObsCallback
};
