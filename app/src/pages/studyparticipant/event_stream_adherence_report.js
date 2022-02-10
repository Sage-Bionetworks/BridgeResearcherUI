import ko from "knockout";
import fn from "../../functions";

export default class EventStreamAdherenceReport {
  constructor(params) {
    this.daysRangeObs = ko.observableArray([]);
    this.streamsObs = ko.observableArray([]);
    this.colspanObs = ko.observable();
    this.activeOnlyObs = ko.observable(false);

    fn.copyProps(this, fn, "formatDateTime", "formatEventId");
    this.editSession = params.editSession;

    params.reportObs.subscribe(report => {
      let range =  report.dayRangeOfAllStreams || {min: 0, max: 0};
      let arr = [];
      for (var i=range.min; i <= range.max; i++) {
        arr.push(i);
      }
      this.activeOnlyObs(report.activeOnly);
      this.daysRangeObs(arr);
      this.colspanObs(arr.length + 3);
      this.streamsObs(report.streams);
    });
  }
  formatTime(item) {
    return `${item.startEventId}: ${item.startDay}—${item.endDay} @ ${item.startTime}`;
  }
  firstRowSessionName(stream) {
    return Object.values(stream.byDayEntries)[0][0].sessionName;
  }
  otherRowSessionName(stream, guid) {
    return Object.values(stream.byDayEntries)
      .flatMap(e => e.filter(f => f.sessionGuid === guid))[0].sessionName;
  }
  cell(stream, cellNum, guid) {
    if (stream.byDayEntries[cellNum]) {
      let day = stream.byDayEntries[cellNum].filter(day => day.sessionGuid === guid);
      if (day.length) {
        return day[0].timeWindows.map(win => {
          let time = (day[0].startDate == win.endDate) ? 
            day[0].startDate : `${day[0].startDate} to ${win.endDate}`;
          return `<span data-guid="${win.sessionInstanceGuid}" 
            data-eventId="${stream.startEventId}" 
            data-eventTimestamp="${stream.eventTimestamp}" 
            data-title="${time}" 
            class="bar ${win.state}"></span>`;
        }).join('');
      }
    }
    return `<div class="empty bar"></div>`;
  }
  isToday(stream, cellNum, guid) {
    if (stream.daysSinceEvent === cellNum) {
      return 'data-cell today';
    }
    return 'data-cell';
  }
  openSession(item, event) {
    if (event.target.nodeName === 'SPAN') {
      let context = ko.contextFor(event.target.parentNode);
      let eventId = event.target.getAttribute('data-eventId');
      let eventTimestamp = event.target.getAttribute('data-eventTimestamp');
      let instanceGuid = event.target.getAttribute('data-guid');
      let dates = event.target.getAttribute('title');
      context.$component.editSession(eventId, eventTimestamp, instanceGuid, dates);
    }
  }
}