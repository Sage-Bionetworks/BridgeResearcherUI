import BaseAccount from "../../accounts/base_account";
import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import tables from "../../tables";
import Promise from "bluebird";
import utils from "../../utils";

class AdherenceStream {
  constructor() { 
    this.label = "";
    this.entries = [];
    // key = instanceGuid + timestamp, value = timeline entry
    this.mapToEntry = {};
  }
  addEntry(entry) {
    entry = JSON.parse(JSON.stringify(entry));
    entry.stream = this;
    this.entries.push(entry);
    this.mapToEntry[entry.instanceGuid + entry.stream.eventTimestamp] = entry;
  }
}

class AdherenceGraph {
  constructor() {
    this.durationInDays = 0;
    this.streams = [];
    // key = session guid, value = AdherenceStream[]
    this.streamsByGuidMap = {};
  }
  getEntry(instanceGuid, eventTimestamp) {
    for (let i=0; i < this.streams.length; i++) {
      let stream = this.streams[i];
      let entry = stream.mapToEntry[instanceGuid + eventTimestamp];
      if (entry) {
        return entry;
      }
    }
    return null;
  }
  addStream(session, event, active) {
    let stream = new AdherenceStream();
    stream.active = active;
    stream.label = session.label;
    stream.eventTimestamp = event.timestamp;
    stream.daysSince = fn.daysSince(event.timestamp);
    stream.timeWindows = session.timeWindowGuids;
    this.streams.push(stream);

    let arr = this.streamsByGuidMap[session.guid] || [];
    arr.push(stream);
    this.streamsByGuidMap[session.guid] = arr;
    return stream;
  }
  addAdherenceRecord(rec) {
    let entry = this.getEntry(rec.instanceGuid, rec.eventTimestamp);
    if (entry) {
      if (rec.startedOn && rec.finishedOn) {
        entry.state = 'finished';
      } else if (rec.startedOn) {
        entry.state = 'started';
      } else {
        entry.state = 'unstarted';
      }
    }
  }
}

const SEARCH_PARAMS = {adherenceRecordType: 'session', pageSize: 5};

export default class StudyParticipantAdherence extends BaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-adherence',
      notFoundParams: {
        redirectTo: `studies/${params.studyId}/participants`,
        redirectMsg: 'Participant not found'
      }
    });

    fn.copyProps(this, fn, "formatDateTime");

    tables.prepareTable(this, { 
      name: "adherence record",
      id: 'studyparticipant-adherence'
    });

    this.graph = new AdherenceGraph();
    this.itemsObs([]);
    this.countObs = ko.observableArray([]);

    serverService.getStudy(this.studyId).then((response) => {
      this.navStudyNameObs(response.name);
    }).then(() => this.getAccount())
      .then(() => serverService.getStudyParticipantActivityEvents(this.studyId, this.userId))
      .then(res => this.loadEventHistories(res))
      .then(() => serverService.getStudyParticipantTimeline(this.studyId, this.userId))
      .then(res => this.processTimeline(res))
      // This initial request is to get the total and calculate pages
      .then(() => serverService.getStudyParticipantAdherenceRecords(
          this.studyId, this.userId, SEARCH_PARAMS))
      .then(res => this.loadAdherenceRecords(res));
      //.catch(utils.failureHandler({ id: 'studyparticipant-adherence' }));
  }
  loadEventHistories(response) {
    return Promise.map(response.items, (event) => {
      if (event.recordCount === 1) {
        return Promise.resolve([event]);
      } else {
        return serverService.getStudyParticipantActivityEventHistory(
            this.studyId, this.userId, event.eventId).then(res => res.items);
      }
    }).reduce((prev, cur) => prev.concat(cur), [])
      .then(res => this.graph.events = res);
  }
  processTimeline(timeline) {
    this.graph.durationInDays = fn.parseDuration(timeline.duration).totalDays;
    
    timeline.sessions.forEach(sess => {
      let first = true;
      this.graph.events.filter(e => e.eventId === sess.startEventId).forEach(e => {
        this.graph.addStream(sess, e, first);
        first = false;
      });
    });

    // Now filter the events of the timeline into these streams.
    for (let i=0; i < timeline.schedule.length; i++) {
      let sch = timeline.schedule[i];

      let streams = this.graph.streamsByGuidMap[sch.refGuid];
      if (streams) {
        streams.forEach(stream => stream.addEntry(sch));
      }
    }
    this.graph.streams.sort((a, b) => a.label.localeCompare(b.label));
  }
  loadAdherenceRecords(res) {
    let total = res.total;
    let pages = Math.ceil(total/250);
    let promises = [];
    for (let i=0; i < pages; i++) {
      promises.push( serverService.getStudyParticipantAdherenceRecords(this.studyId, this.userId, 
        {offset: i*250, pageSize:250, adherenceRecordType: 'session'}).then(res => res.items) );
    }
    return Promise.reduce(promises, (prev, cur) => prev.concat(cur), [])
      .then((res) => this.processAdherenceRecords(res));
  }
  processAdherenceRecords(items) {
    for (let i=0; i < items.length; i++) {
      this.graph.addAdherenceRecord(items[i]);
    }
    this.countObs(new Array(this.graph.durationInDays));
    this.itemsObs(this.graph.streams);
  }
  streamEntry(stream, day) {
    let array = new Array(stream.timeWindows.length);
    stream.entries.filter(e => e.startDay <= day && e.endDay >= day).map((entry) => {
      let index = stream.entries.indexOf(entry);

      // unstarted
      let data = { secondClassName: '', secondBorderColor: '' };

      // past or abandoned
      if (!stream.active || entry.endDay < stream.daysSince) {
        // Only finished counts, everything else is red
        if (entry.state === 'finished') {
          data.className = 'green bgGreen';
        } else if (entry.state === 'started') {
          data.className = 'bgRed';
        } else {
          data.className = 'red bgRed';
        }
      } 
      // future
      else if (entry.startDay > stream.daysSince) {
        data.className = 'gray bgGray';
      } 
      // currently active
      else {
        if (entry.state === 'finished') {
          data.className = 'green bgGreen';
        } else if (entry.state === 'started') {
          data.className = 'bgGreen';
        } else {
          data.className = 'blue bgBlue';
        }
      }
      // We need this for the "both bars" calculation, below
      entry.className = data.className;

      // add the bar graphic
      let previous = null;
      for (let i=index-1; i >=0; i--) {
        if (entry.timeWindowGuid === stream.entries[i].timeWindowGuid) {
          previous = stream.entries[i];
          break;
        }
      }
      if (previous && entry.startDay === day && previous.endDay === entry.startDay) {
        // we want this to be the previous day's calculation...
        data.secondClassName = data.className + ' rightBoth bar';
        data.className = previous.className + ' leftBoth bar';
      } else if (entry.startDay === day && entry.endDay === day) {
        data.className += ' bar single';
      } else if (entry.startDay === day) {
        data.className += ' bar left';
      } else if (entry.endDay === day) {
        data.className += ' bar right';
      } else {
        data.className += ' bar mid';
      }
      array[stream.timeWindows.indexOf(entry.timeWindowGuid)] = data;
    });
    for (let i=0; i < array.length; i++) {
      if (typeof array[i] === 'undefined') {
        array[i] = { className: 'white bgWhite bar mid' };
      }
    }
    return array;
  }
  streamEntryBg(stream, day) {
    if (!stream.active) { 
      return 'inactive';
    } else if (day === stream.daysSince) {
      return 'today';
    }
    return '';
  }
  // basic view model functions/subclass functions
  loadAccount() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  link(postfix) {
    return `#/studies/${this.studyId}/participants/${encodeURIComponent(this.userId)}/${postfix}`;
  }
  formatTime(item) {
    return `${item.startEventId}: ${item.startDay}—${item.endDay} @ ${item.startTime}`;
  }
}