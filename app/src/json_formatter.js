import ko from "knockout";

function prettyPrintHTML(obj) {
  if (!obj) {
    return "";
  }
  // This used to be a pretty print library but it broke.
  return JSON.stringify(obj, undefined, 2);
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
  if (string) {
    return JSON.stringify(JSON.parse(string), null, 2)
  }
  return '';
}

export default { prettyPrint, mapItem, mapClientDataItem, prettyPrintHTML, prettyPrintStringAsHTML };
