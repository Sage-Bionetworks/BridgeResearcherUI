import password from "./password_generator";

const FIELDS = ['firstName', 'lastName', 'email', 'password', 'externalId', 'sharingScope', 'identifier'];

function parseStanzas(string) {
  let records = [];
  let inQuote = false;
  for (let i=0; i < string.length; i++) {
    if (string.charAt(i) === '"') {
      inQuote = !inQuote;
    }
    if (string.charAt(i) === ',' && !inQuote) {
      records.push(string.substring(0,i));
      string = string.substring(i+1);
      i=0;
    }
  }
  records.push(string);
  return records.map(stanza => stanza.trim()).filter((value) => value.length > 0);
}

function parseOneStanza(stanza) {
  let obj = {};
  // We need something more complex to suss this out.
  if (stanza.indexOf('=') > -1) {
    let records = [];
    let inQuote = false;
    for (let i=0; i < stanza.length; i++) {
      if (stanza.charAt(i) === '"') {
        inQuote = !inQuote;
      }
      if (stanza.charAt(i) === ' ' && !inQuote) {
        records.push(stanza.substring(0,i).trim());
        stanza = stanza.substring(i);
        i=0;
      }
    }
    records.push(stanza.trim()); // one last time
    records.forEach((pair) => {
      let [prop, value] = pair.split('=');
      if (FIELDS.includes(prop)) {
        value = ((value.charAt(0) === '"') && value.charAt(value.length-1) === '"') ?
        value.substring(1, value.length-1) : value;
        obj[prop] = value;
      } else {
        obj.externalId = prop;
        obj.password = value;
      }
    });
  } else {
    obj.externalId = stanza;
  }
  if (!obj.password) {
    obj.password = password.generatePassword(32)
  }
  if (!obj.sharingScope) {
    obj.sharingScope = "all_qualified_researchers"
  }
  if (obj.externalId && !obj.identifier) {
    obj.identifier = obj.externalId;
  }
  if (obj.identifier && !obj.externalId) {
    obj.externalId = obj.identifier;
  }
  return obj;
}

export default function(string) {
  return parseStanzas(string).map(parseOneStanza);
}