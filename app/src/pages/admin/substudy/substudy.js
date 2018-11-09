import {serverService} from '../../../services/server_service';
import Binder from '../../../binder';
import fn from '../../../functions';
import utils from '../../../utils';

var failureHandler = utils.failureHandler({
    redirectMsg:"Substudy not found.", 
    redirectTo:"admin/substudies",
    transient: false
});

module.exports = function(params) {
    let self = this;
    self.substudy = {};

    fn.copyProps(self, fn, 'formatDateTime');

    let binder = new Binder(self)
        .obs('title', 'New Substudy')
        .obs('isNew', (params.id === 'new'))
        .obs('createdOn')
        .obs('modifiedOn')
        .bind('version')
        .bind('name')
        .bind('id', (params.id === 'new') ? null : params.id);

    function load() {
        return (params.id === "new") ?
            Promise.resolve({}) :
            serverService.getSubstudy(params.id).then(titleUpdated);
    }
    function saveSubstudy() {
        return (params.id === "new") ?
            serverService.createSubstudy(self.substudy) :
            serverService.updateSubstudy(self.substudy);
    }
    function updateModifiedOn(response) {
        params.id = self.idObs();
        self.modifiedOnObs(new Date());
        self.versionObs(response.version);
        return response;
    }

    let titleUpdated = fn.handleObsUpdate(self.titleObs, 'name');

    self.save = function(vm, event) {
        self.substudy = binder.persist(self.substudy);

        utils.startHandler(vm, event);
        saveSubstudy()
            .then(fn.handleStaticObsUpdate(self.isNewObs, false))
            .then(fn.handleObsUpdate(self.versionObs, 'version'))
            .then(updateModifiedOn)
            .then(fn.returning(self.substudy))
            .then(titleUpdated)
            .then(utils.successHandler(vm, event, "Sub-study has been saved."))
            .catch(failureHandler);
    };

    load()
        .then(binder.assign('study'))
        .then(binder.update());
};