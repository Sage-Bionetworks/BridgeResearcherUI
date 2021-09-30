import BaseAccount from "../../accounts/base_account";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import Promise from "bluebird";
import utils from "../../utils";

// Sort them by session name and then the triggering event, but put the study bursts
// after everything else.
function sortEvents(e1, e2) {
  let sb1 = e1.eventId.startsWith('study_burst');
  let sb2 = e2.eventId.startsWith('study_burst');
  let b = (sb1 && !sb2) ? 1 : (!sb1 && sb2) ? -1 : 0;
  return b || e1.eventId.localeCompare(e2.eventId);
}

class AdherenceGraph {
  constructor() {
    this.durationInDays = 0;
    this.streams = [];
    // key = session guid, value = AdherenceStream[]
    this.streamsByGuidAndEventMap = {};
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
    // this isn't working correctly...nowhere do we calculate the days, like the schedule tab.
    stream.active = true; 
    stream.label = session.label;
    stream.eventTimestamp = event.timestamp;
    stream.eventId = event.eventId;
    stream.daysSince = fn.daysSince(event.timestamp);
    stream.timeWindows = session.timeWindowGuids;
    this.streams.push(stream);

    let arr = this.streamsByGuidAndEventMap[session.guid + event.eventId] || [];
    arr.push(stream);
    this.streamsByGuidAndEventMap[session.guid + event.eventId] = arr;
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

class AdherenceStream {
  constructor() { 
    this.label = ""; // session name
    this.entries = []; // 
    // key = instanceGuid + timestamp, value = timeline entry
    this.mapToEntry = {};
    this.maxDay = 0;
  }
  addEntry(entry) {
    entry = JSON.parse(JSON.stringify(entry));
    entry.stream = this;
    // optimization: we can stop processing the table when we know a stream has no more entries to look at.
    if (entry.endDay > this.maxDay) {
      this.maxDay = entry.endDay;
    }
    this.entries.push(entry);
    this.mapToEntry[entry.instanceGuid + entry.stream.eventTimestamp] = entry;
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

    this.load();
  }
  load() {
    this.graph = new AdherenceGraph();
    // the Y axis of days we are going to graph
    this.dayCountObs = ko.observableArray([]);
    this.itemsObs([]);

    // 1. get study, get account
    // 2. get the most recent activity events
    // 3. for those having more than 1 entry, load the full history up to 100 entries
    // 4. get the timeline for the user, process
    // 5. get a page of adherence records to get total number and calc pages
    // 6. get all adherence records, process
    serverService.getStudy(this.studyId).then((response) => {
      this.navStudyNameObs(response.name);
    }).then(() => this.getAccount()) // 1
      .then(() => serverService.getStudyParticipantActivityEvents(this.studyId, this.userId)) // 2
      .then(res => this.loadEventHistories(res)) // 3
      .then(() => serverService.getStudyParticipantTimeline(this.studyId, this.userId)) // 4
      .then(res => this.processTimeline(res))
      .then(() => serverService.getStudyParticipantAdherenceRecords(this.studyId, this.userId, SEARCH_PARAMS)) // 5
      .then(res => this.loadAdherenceRecords(res)) // 6
      .catch(utils.failureHandler({ id: 'studyparticipant-adherence' }));
  }
  // if record count is one, you have the event, otherwise, get the last 100 of them, adding all events 
  // in an array to graph events for later processing into streams.
  loadEventHistories(response) {
    return Promise.map(response.items, (event) => {
      if (event.recordCount === 1) {
        return Promise.resolve([event]);
      } else {
        return serverService.getStudyParticipantActivityEventHistory(
            this.studyId, this.userId, event.eventId, 0, 100).then(res => res.items);
      }
    }).reduce((prev, cur) => prev.concat(cur), [])
      .then(res => this.graph.events = res);
  }
  // For each session in the timeline, filter the events into a stream for that session. 
  // One session / event timestamp == one stream. The first under an event ID is marked 
  // out as the active stream.
  processTimeline(timeline) {
    this.graph.events.sort(sortEvents);

    // This is not really true. The graph only needs to be as wide as the largest endDay
    // of any stream. The duration of the schedule only controls how many times sessions will 
    // repeat if a hard number of iterations is not provided.
    // this.graph.durationInDays = fn.parseDuration(timeline.duration).totalDays;

    // create a map of sessions so we can look them up
    let sessionMap = timeline.sessions.reduce((arr, sess) => {
      sess.startEventIds = new Set();
      arr[sess.guid] = sess;
      return arr;
    }, {});

    // We need to assemble all possible event IDs that a session can be fired by, so the next
    // step is grouped correctly.
    timeline.schedule.forEach(sch => sessionMap[sch.refGuid].startEventIds.add(sch.startEventId));
        
    // Create streams (the X-axis of the graph). There's a stream for each session, for 
    // each of the events that triggers the session.
    timeline.sessions.forEach(sess => {
      this.graph.events.filter(e => sess.startEventIds.has(e.eventId)).forEach((e, i) => {
        this.graph.addStream(sess, e, i === 0);
      });
    });

    // Filter the scheduled sessions into these streams. 
    timeline.schedule.forEach(sch => {
      let streams = this.graph.streamsByGuidAndEventMap[sch.refGuid + sch.startEventId] || [];
      streams.forEach(stream => stream.addEntry(sch));
    });

    // durationInDays === the largest end day of any stream (if there are any streams)
    if (this.graph.streams.length) {
      this.graph.durationInDays = Math.max.apply(this, this.graph.streams.map(s => s.maxDay)) + 1;
    }
  }
  // load all pages of adherence records, reduce them to a single array, pass to processing func
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
    items.forEach(item => this.graph.addAdherenceRecord(item));
    this.dayCountObs(new Array(this.graph.durationInDays));
    this.itemsObs(this.graph.streams);  
  }
  streamEntry(stream, day) {
    // This short-circuits all this processing...which has a negligible impact on performance
    if (stream.maxDay < day) {
      let array = new Array(stream.timeWindows.length);
      for (var i=0; i < array.length; i++) {
        array[i] = {};
      }
      return array;
    }
    /* end spurious optimization */
    
    let array = new Array(stream.timeWindows.length);

    stream.entries.filter(e => e.startDay <= day && e.endDay >= day).map((entry) => {
      let index = stream.entries.indexOf(entry);

      let data = {
        className: '',
        secondClassName: '',
        instanceGuid: entry.instanceGuid,
        eventTimestamp: entry.stream.eventTimestamp,
        eventId: entry.stream.eventId
      };

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
        if (entry.state === 'finished') {
          data.className = 'green bgGreen';
        } else if (entry.state === 'started') {
          data.className = 'bgGreen';
        } else {
          data.className = 'gray bgGray';
        }
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
      // We need this for the "both bars" calculation, below, where we refer to it as
      // "previous.className"
      entry.previousClassName = data.className;
      entry.previousInstanceGuid = data.instanceGuid;

      // add the bar graphic
      let previous = null;
      for (let i=index-1; i >=0; i--) {
        if (entry.timeWindowGuid === stream.entries[i].timeWindowGuid && 
          entry.startEventId === stream.entries[i].startEventId) {
          previous = stream.entries[i];
          break;
        }
      }
      data.previousInstanceGuid = data.instanceGuid;

      if (previous && entry.startDay === day && previous.endDay === entry.startDay) {
        // we want this to be the previous day's calculation...
        data.secondClassName = data.className + ' rightBoth bar';
        data.className = previous.previousClassName + ' leftBoth bar';
        data.previousInstanceGuid = previous.previousInstanceGuid;
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
  formatEventId(eventId) {
    return eventId;
  }
  formatTime(item) {
    return `${item.startEventId}: ${item.startDay}—${item.endDay} @ ${item.startTime}`;
  }
  closeDialog() {
    root.closeDialog();
    this.load();
  }
  editSession(item, event) {
    let component = ko.contextFor(event.target).$component;
    let instanceGuid = event.target.getAttribute('data-guid');
    setTimeout(() => {
      root.openDialog("session_editor", { 
        studyId: component.studyId,
        userId: component.userId,
        instanceGuid: instanceGuid, 
        eventId: item.eventId,
        eventTimestamp: item.eventTimestamp,
        closeDialog: component.closeDialog.bind(component)
      });
    }, 1);
  }
}