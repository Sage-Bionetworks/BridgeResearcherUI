import fn from "../../functions";
import serverService from "../../services/server_service";

const SYSTEM_EVENTS = ['enrollment', 'activities_retrieved', 'created_on', 'study_start_date'];
const SORTER = fn.makeFieldSorter("text");

export function getEventIds() {
  return serverService.getApp().then(app => {
    var array = SYSTEM_EVENTS.map(s => ({text: s, value: s}));
    array = array.concat(app.activityEventKeys.map(s => ({text: s, value: 'custom:'+s})));
    array.sort(SORTER);
    return array;
  });
}