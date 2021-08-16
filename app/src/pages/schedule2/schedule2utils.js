import fn from "../../functions";
import serverService from "../../services/server_service";

const SYSTEM_EVENTS = ['enrollment', 'timeline_retrieved', 'created_on', 'install_link_sent'];
const SORTER = fn.makeFieldSorter("text");

export function getEventIds(studyId) {
  return serverService.getStudy(studyId).then(study => {
    var array = SYSTEM_EVENTS.map(s => ({text: s, value: s}));
    array.sort(SORTER);
    study.customEvents.forEach(event => {
      array.push({text: event.eventId, value: event.eventId})
    });
    return array;
  });
}