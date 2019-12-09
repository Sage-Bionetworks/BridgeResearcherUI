import fn from "../../../functions";
import serverService from "../../../services/server_service";
import tables from "../../../tables";

function deleteMasterSchedule(item) {
  return serverService.deleteMasterSchedule(item.scheduleId);
}

export default function() {
  let self = this;

  tables.prepareTable(self, {
    name: "master schedule",
    plural: "master schedules",
    delete: deleteMasterSchedule,
    refresh: load
  });

  function load() {
    return serverService.getMasterSchedules()
      .then(fn.handleObsUpdate(self.itemsObs, "items"));
  }
  load();
};

/*
  getMasterSchedules() {
    return this.gethttp(config.masterschedule);
  }
  createMasterSchedule(schedule) {
    return this.post(config.masterschedule, schedule);
  }
  getMasterSchedule(scheduleId) {
    return this.gethttp(`${config.masterschedule}/${scheduleId}`);
  }
  updateMasterSchedule(masterschedule) {
    return this.post(`${config.masterschedule}/${masterschedule.scheduleId}`, masterschedule);
  }
  deleteMasterSchedule(scheduleId) {
    return this.del(`${config.masterschedule}/${scheduleId}`);
  }
  */