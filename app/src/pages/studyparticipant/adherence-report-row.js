import fn from "../../functions";
import ko from "knockout";
import root from "../../root";

export default class AdherenceReportRow {
  constructor(params) {
    this.showUser = params.showUser;
    this.week = params.week || {};
    this.week.rows = this.week.rows || [];
    this.report = params.report;
    this.studyId = params.studyId;
    this.userId = params.userId;
    this.editSession = this.editSession.bind(this);

    fn.copyProps(this, fn, "formatNameAsFullLabel", "formatDate");
  }
  participantLink(id) {
    return `/studies/${this.studyId}/participants/${id}/adherence/study`;
  }
  formatAdh(week) {
    if (typeof week.weeklyAdherencePercent !== 'undefined') {
      return week.weeklyAdherencePercent + '%';
    }
    if (typeof week.adherencePercent !== 'undefined') {
      return week.adherencePercent + '%';
    }
    return '';
  }
  formatRow(row) {
    if (row.studyBurstId) {
      let burstLabel = row.studyBurstId;
      if (burstLabel.length > 25) {
        burstLabel = burstLabel.substring(0,20) + '…';
      }
      return `<span data-title="${row.studyBurstId}">` + 
        `${burstLabel} #${row.studyBurstNum}</span>`;
    }
    return row.sessionName;
  }
  formatProgress(week) {
    if (week.progression) {
      switch(week.progression) {
        case 'unstarted':
          return '— Unstarted —';
        case 'in_progress':
          return this.formatNextActivity(week.nextActivity);
        case 'done':
          return '— Done —';
        case 'no_schedule':
          return '— No Schedule —';
      }
      return '—';
    }
  }  
  formatWin(arg, rowIndex, dayIndex) {
    let entry = arg.byDayEntries[dayIndex][rowIndex];
    if (Object.keys(this.report).length > 0) {
      return entry.timeWindows.map(win => {
        let time = (entry.startDate == win.endDate) ? 
          this.formatDate(entry.startDate) : 
          `${this.formatDate(entry.startDate)} to ${this.formatDate(win.endDate)}`;
        if (!time) { time = 'N/A' };
        return `<span data-guid="${win.sessionInstanceGuid}" 
          data-title="${time}"
          data-eventId="${entry.startEventId}" 
          data-eventTimestamp="${this.report.eventTimestamps[entry.startEventId]}"
          class="bar ${win.state}"></span>`;
      }).join('');
    } else {
      return entry.timeWindows.map(win => {
        let time = (entry.startDate == win.endDate) ? 
          this.formatDate(entry.startDate) : 
          `${this.formatDate(entry.startDate)} to ${this.formatDate(win.endDate)}`;
        return `<span data-title="${time}" class="bar ${win.state}"></span>`
      }).join('');
    }
  }
  isToday(arg, rowIndex, dayIndex) {
    let entry = arg.byDayEntries[dayIndex][rowIndex];
    return (entry.today) ? 'today' : '';
  }
  formatNextActivity(entry) {
    return (!entry) ? '' : 
    `Next activity on ${fn.formatDate(entry.startDate)} (Week ${entry.weekInStudy})`;
  }
  openSession(item, event) {
    if (event.target.nodeName === 'SPAN') {
      let eventId = event.target.getAttribute('data-eventId');
      let eventTimestamp = event.target.getAttribute('data-eventTimestamp');
      let instanceGuid = event.target.getAttribute('data-guid');
      let dates = event.target.getAttribute('data-title');
      if (!eventId || !eventTimestamp || !instanceGuid) {
        return;
      }
      this.editSession(eventId, eventTimestamp, instanceGuid, dates);
    }
  }  
  closeDialog() {
    root.closeDialog();
    ko.postbox.publish('load-adherence');
  }
  editSession(eventId, eventTimestamp, instanceGuid, dates) {
    setTimeout(() => {
      root.openDialog("session_editor", { 
        closeDialog: this.closeDialog.bind(this),
        studyId: this.studyId,
        userId: this.userId,
        eventId, 
        eventTimestamp, 
        instanceGuid, 
        dates
      });
    }, 1);
  }
}

