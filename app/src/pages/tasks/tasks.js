import * as fn from '../../functions';
import { Promise } from 'bluebird';
import scheduleUtils from '../schedule/schedule_utils';
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

function deleteItem(task) {
    return serverService.deleteTaskDefinition(task.taskId);
}

module.exports = function() {
    var self = this;

    tables.prepareTable(self, {
        name: 'task',
        type: 'CompoundActivityDefinition',
        delete: deleteItem,
        refresh: load
    });

    fn.copyProps(self, scheduleUtils, 'formatCompoundActivity');

    self.copy = function(vm, event) {
        var copyables = self.itemsObs().filter(tables.hasBeenChecked);
        var confirmMsg = (copyables.length > 1) ?
            "Tasks have been copied." : "Task has been copied.";

        utils.startHandler(vm, event);
        Promise.mapSeries(copyables, function(task) {
            task.taskId += "-copy";
            delete task.version;
            return serverService.createTaskDefinition(task);
        }).then(load)
            .then(utils.successHandler(vm, event, confirmMsg))
            .catch(utils.failureHandler({transient:false}));
    };
    function load() {
        scheduleUtils.loadOptions()
            .then(serverService.getTaskDefinitions)
            .then(fn.handleSort('items','taskId'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};