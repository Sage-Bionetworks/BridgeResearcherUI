import ko from 'knockout';

// See http://jsfiddle.net/unlsj/
const JSON_LINE = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
const KEY = '<span class=json-key>';
const VAL = '<span class=json-value>';
const STR = '<span class=json-string>';
const COLON = /[": ]/g;

function htmlReplacer(match, pIndent, pKey, pVal, pEnd) {
    var r = pIndent || '';
    if (pKey) {
        r = r + KEY + pKey.replace(COLON, '') + '</span>: ';
    }
    if (pVal) {
        r = r + (pVal[0] == '"' ? STR : VAL) + pVal + '</span>';
    }
    return r + (pEnd || '');
}
function prettyPrintHTML(obj) {
    if (!obj) { 
        return "";
    }
    return JSON.stringify(obj, null, 3)
        .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(JSON_LINE, htmlReplacer);
}
function replacer(match, pIndent, pKey, pVal, pEnd) {
    var r = pIndent || '';
    if (pKey) {
        r = r + '"' + pKey.replace(COLON, '') + '": ';
    }
    if (pVal) {
        r = r + pVal;
    }
    return r + (pEnd || '');
}
function prettyPrint(obj) {
    if (!obj) { 
        return "";
    }
    return JSON.stringify(obj, null, 3)
        .replace(JSON_LINE, replacer);
}
function mapItem(item) {
    item.collapsedObs = ko.observable(true);
    try {
        item.formattedData = prettyPrintHTML(item.data);
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
        item.formattedData = prettyPrintHTML(JSON.parse(item.clientData));
    }
    return item;
}

export default { prettyPrint, mapItem, mapClientDataItem };