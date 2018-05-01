import ko from 'knockout';

const INDENT_SIZE = 2;
const QUOTE_LITERAL = ['<span class=json-key>"', '"</span>', '<span class=json-string>"', '"'];

function prettyPrintHTML(obj) {
    if (!obj) { 
        return "";
    }
    return prettyPrintStringAsHTML(JSON.stringify(obj));
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
        if (typeof item.clientData === 'string') {
            item.formattedData = prettyPrintHTML(JSON.parse(item.clientData));
        } else {
            item.formattedData = prettyPrintHTML(item.clientData);
        }
    }
    return item;
}

function addIndent(indent) {
    return ' '.repeat(indent);
}

function prettyPrintStringAsHTML(string) {
    if (!string) {
        return '';
    }
    let indent = 0;
    let output = "";
    let stringState = 0;
    for (let i=0, len = string.length; i < len; i++) {
        let oneChar = string.charAt(i);
        if (oneChar === '{' || oneChar === '[') {
            indent += INDENT_SIZE;
            output += (oneChar+"\n" + addIndent(indent));
        } else if (oneChar === '}' || oneChar === ']') {
            indent -= INDENT_SIZE;
            output += ("\n" + addIndent(indent) + oneChar);
        } else if (oneChar === '"') {
            output += QUOTE_LITERAL[stringState];
            stringState++;
        } else if (oneChar === ':') {
            if (stringState === 2) {
                output += (oneChar+' ');
            } else {
                output += oneChar;
            }
        } else if (oneChar === ',') {
            if (stringState !== 3) {
                output += ("</span>,\n" + addIndent(indent));
                stringState = 0;
            } else {
                output += oneChar;
            }
        } else if (stringState === 2) {
            output += '<span class=json-value>'+oneChar;
        } else {
            output += oneChar;
        }
    }
    return output;
}

export default { prettyPrint, mapItem, mapClientDataItem, prettyPrintHTML, prettyPrintStringAsHTML };