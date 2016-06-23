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
        var json = JSON.parse(item.data);
        item.formattedData = prettyPrint(json);
        item.collapsedValue = "{&hellip;}";
        item.isJson = true;
    } catch(e) {
        item.collapsedObs(false);
        item.collapsedValue = "&hellip;";
        item.isJson = false;
    }
    return item;
}

module.exports = {
    mapItem: mapItem
};