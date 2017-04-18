var ko = require('knockout');

// See http://jsfiddle.net/unlsj/
var JSON_LINE = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
var KEY = '<span class=json-key>';
var VAL = '<span class=json-value>';
var STR = '<span class=json-string>';
var COLON = /[": ]/g;

function replacer(match, pIndent, pKey, pVal, pEnd) {
    var r = pIndent || '';
    if (pKey) {
        r = r + KEY + pKey.replace(COLON, '') + '</span>: ';
    }
    if (pVal) {
        r = r + (pVal[0] == '"' ? STR : VAL) + pVal + '</span>';
    }
    return r + (pEnd || '');
}
function prettyPrint(obj) {
    return JSON.stringify(obj, null, 3)
        .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(JSON_LINE, replacer);
}
function mapItem(item) {
    item.collapsedObs = ko.observable(true);
    try {
        item.formattedData = prettyPrint(item.data);
        item.isJson = true;
    } catch(e) {
        item.collapsedObs(false);
        item.isJson = false;
    }
    return item;
}
function mapClientDataItem(item) {
    item.collapsedObs = ko.observable(true);
    item.isDisabled = (item.status === 'expired');
    if (item.clientData) {
        item.formattedData = prettyPrint(item.clientData);
    }
    return item;
}

module.exports = {
    mapItem: mapItem,
    mapClientDataItem: mapClientDataItem
};