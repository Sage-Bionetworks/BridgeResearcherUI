import Binder from "../../binder";
import BaseStudy from "./base_study";

const UPDATE_TYPES = [
  {label: "Immutable", value: "immutable"},
  {label: "Mutable", value: "mutable"},
  {label: "Future timestamps only", value: "future_only"}
];

function modelsToView(array) {
  return array.map(oneModelToView);
}
function oneModelToView(el) {
  el.binder = new Binder(el)
    .bind("eventId", el.eventId)
    .bind("updateType", el.updateType)
    .obs("allUpdateTypes", UPDATE_TYPES);
  return el;
}

export default class StudyCustomEvents extends BaseStudy {
  constructor(params) {
    super(params, 'study-events');

    this.removeEvent = this.removeEvent.bind(this);
    this.binder.bind("customEvents[]", null, modelsToView, Binder.persistArrayWithBinder);
    
    super.load();
  }
  addCustomEvent() {
    let item = oneModelToView({});
    this.customEventsObs.push(item);
  }
  removeEvent(item) {
    this.customEventsObs.remove(item);
  }
  canEdit() {
    return ['legacy', 'design'].includes(this.phaseObs());
  }
}
