import password from "./password_generator";

const FIELDS = ['firstName', 'lastName', 'email', 'password', 'externalId', 'sharingScope', 'identifier'];

function parseStanzas(string) {
  let records = [];
  let inQuote = false;
  for (let i=0; i < string.length; i++) {
    if (string.charAt(i) === '"') {
      inQuote = !inQuote;
    }
    if ((string.charAt(i) === ',' || string.charAt(i) === '\n') && !inQuote) {
      let obj = parseOneStanza(string.substring(0,i));
      if (obj) {
        records.push(obj);
      }
      string = string.substring(i+1);
      i=0;
    }
  }
  let obj = parseOneStanza(string);
  if (obj) {
    records.push(obj);
  }
  return records;
}

function parseOneStanza(stanza) {
  stanza = stanza.trim();
  if (stanza.length === 0) {
    return null;
  }
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
    records.push(stanza);
    records.forEach((pair) => {
      let [prop, value] = pair.split('=');
      prop = prop.trim();
      value = value.trim();
      if (FIELDS.includes(prop)) {
        if ((value.charAt(0) === '"') && value.charAt(value.length-1) === '"') {
          value = value.substring(1, value.length-1);
        }
        obj[prop] = value;
      } else {
        obj.externalId = prop;
        obj.password = value;
      }
    });
  } else {
    obj.externalId = stanza;
  }
  obj.password = obj.password || password.generatePassword(32);
  obj.sharingScope = obj.sharingScope || "all_qualified_researchers";
  if (obj.externalId && !obj.identifier) {
    obj.identifier = obj.externalId;
  }
  if (obj.identifier && !obj.externalId) {
    obj.externalId = obj.identifier;
  }
  return obj;
}

export default function(string) {
  return parseStanzas(string);
}