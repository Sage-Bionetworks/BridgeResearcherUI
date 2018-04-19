import ko from 'knockout';

// See http://jsfiddle.net/unlsj/
const JSON_LINE = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
const KEY = '<span class=json-key>';
const VAL = '<span class=json-value>';
const STR = '<span class=json-string>';
const COLON = /[": ]/g;
const INDENT_SIZE = 2;

function htmlReplacer(match, pIndent, pKey, pVal, pEnd) {
    let r = pIndent || '';
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
function prettyPrint(obj) {
    if (!obj) { 
        return "";
    }
    return JSON.stringify(obj, null, 2);
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

function addIndent(indent) {
    let string = "";
    for (let i=0; i < indent; i++) {
        string += "&#160;";
    }
    return string;
}
function prettyPrintStringAsHTML(string) {
    if (!string) {
        return;
    }
    let indent = 0;
    let output = "";
    for (let i=0; i < string.length; i++) {
        let charAt = string.charAt(i);
        if (charAt === '{') {
            indent += INDENT_SIZE;
            output += (" {<br>" + addIndent(indent));
        } else if (charAt === '}') {
            indent -= INDENT_SIZE;
            output += ("<br>" + addIndent(indent) + "}");
        } else if (charAt === '[') {
            indent += INDENT_SIZE;
            output += (" [<br>" + addIndent(indent));
        } else if (charAt === ']') {
            indent -= INDENT_SIZE;
            output += ("<br>" + addIndent(indent) + "]");
        } else if (charAt === ',') {
            output += (",<br>" + addIndent(indent));
        } else if (charAt === ':') {
            output += (": ");
        } else {
            output += charAt;
        }
    }
    return output;
}

export default { prettyPrint, mapItem, mapClientDataItem, prettyPrintHTML, prettyPrintStringAsHTML };