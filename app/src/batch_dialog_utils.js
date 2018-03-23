import {ServerService} from './services/server_service';
import Binder from './binder';

const serverService = new ServerService(false);

export default {
    initBatchDialog: function(vm) {
        new Binder(vm)
            .obs('errorMessages[]',[])
            .obs('status')
            .obs('value', 0)
            .obs('max', 0)
            .obs('percentage', '0%');

        vm.progressIndex = 0;
        vm.steps = 0; // for now
        vm._cancel = false;

        function errorMessage(e) {
            if (e.responseJSON && e.responseJSON.message) {
                return e.responseJSON.message;
            } else if (e.message) {
                return e.message;
            } else if (e.status === 0) {
                return "could not connect to the server.";
            }
            return "an error occurred while processing.";
        }
        function promiseHandler(worker, isErrorHandler) {
            return function(e) {
                // Export has taken long enough that session timed out. Reauthenticate and continue.
                if (e && e.status === 401) {
                    return serverService.reauthenticate()
                        .then(function() {
                            return executer(worker);
                        });
                }
                vm.updateStatus(++vm.progressIndex, vm.steps);
                if (isErrorHandler) {
                    vm.errorMessagesObs.unshift( worker.currentWorkItem()+": "+errorMessage(e) );
                }
                if (vm._cancel) {
                    return Promise.resolve();
                }
                if (worker.hasWork()) {
                    vm.statusObs(worker.workDescription());
                    return executer(worker);
                } else {
                    return worker.postFetch();
                }
            };
        }
        function executer(worker) {
            return worker.performWork().then(promiseHandler(worker))
                .catch(promiseHandler(worker, true));
        }

        vm.cancel = function() {
            vm._cancel = true;
        };
        vm.updateStatus = function(progressIndex, steps) {
            vm.progressIndex = progressIndex;
            vm.steps = steps;
            vm.valueObs(progressIndex);
            vm.maxObs(steps);
            let perc = ((progressIndex/steps)*100).toFixed(0);
            if (perc > 100) { perc = 100; }
            vm.percentageObs(perc+"%");
        };
        vm.run = function(worker) {
            vm.updateStatus(1, worker.calculateSteps());
            vm.statusObs(worker.workDescription());
            return executer(worker);
        };
    }
};