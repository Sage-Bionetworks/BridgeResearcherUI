import ko from "knockout";
import printer from 'pretty-print-json';

function prettyPrintHTML(obj) {
  if (!obj) {
    return "";
  }
  return printer.toHtml(obj);
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
  } catch (e) {
    item.collapsedObs(false);
    item.isJson = false;
  }
  return item;
}
function mapClientDataItem(item) {
  item.collapsedObs = ko.observable(true);
  item.isDisabled = item.status === "expired";
  if (item.clientData) {
    if (typeof item.clientData === "string") {
      item.formattedData = prettyPrintHTML(JSON.parse(item.clientData));
    } else {
      item.formattedData = prettyPrintHTML(item.clientData);
    }
  }
  return item;
}

function prettyPrintStringAsHTML(string) {
  return printer.toHtml(JSON.parse(string));
}

export default { prettyPrint, mapItem, mapClientDataItem, prettyPrintHTML, prettyPrintStringAsHTML };
