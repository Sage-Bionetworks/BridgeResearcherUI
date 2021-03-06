import fn from "../../functions";
import serverService from "../../services/server_service";

const SYSTEM_EVENTS = ['enrollment', 'timeline_retrieved', 'created_on', 'install_link_sent'];
const SORTER = fn.makeFieldSorter("text");

export function getEventIds() {
  return serverService.getApp().then(app => {
    var array = SYSTEM_EVENTS.map(s => ({text: s, value: s}));
    Object.keys(app.customEvents).forEach(key => {
      array.push({text: key, value: 'custom:'+key})
    });
    array.sort(SORTER);
    return array;
  });
}