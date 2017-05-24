var funcs = require('./functions');

function isBlank(obj) {
    return (typeof obj === "undefined") || obj === null || obj === "";
}
function persistAttributes(value) {
    return value.reduce(function(map, value) {
        map[value.key] = value.obs();
        return map;
    }, {});
}
function formatTitle(value, context) {
    var user = context.model;
    if (user.id === "new" && isBlank(user.firstName) && isBlank(user.lastName)) {
        return "New participant";
    }
    return funcs.formatName(context.model);
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
function callObsCallback(value, context) {
    return context.observer.callback();
}

module.exports = {
    formatAttributes: formatAttributes,
    formatHealthCode: formatHealthCode,
    formatName: funcs.formatName,
    formatTitle: formatTitle,
    persistAttributes: persistAttributes,
    callObsCallback: callObsCallback/*,
    formatRoles: funcs.formatRoles,
    persistRoles: funcs.persistRoles,
    formatLanguages: funcs.formatLanguages,
    persistLanguages: funcs.persistLanguages,
    formatTitleCase: funcs.formatTitleCase,
    formatDate: funcs.formatDate,
    formatDateTime: funcs.formatDateTime,
    formatVersionRange: funcs.formatVersionRange,
    formatMs: funcs.formatMs,
    queryString: funcs.queryString,
    localDateTimeToUTC: funcs.localDateTimeToUTC,
    utcTolocalDateTime: funcs.utcTolocalDateTime,
    dateTimeString: funcs.dateTimeString*/
};
