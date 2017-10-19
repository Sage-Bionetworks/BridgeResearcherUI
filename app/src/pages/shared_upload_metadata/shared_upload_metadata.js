import {serverService} from '../../services/server_service';
import * as schemaUtils from '../../pages/schema/schema_utils';
import Binder from '../../binder';
import fn from '../../functions';
import root from '../../root';
import utils from '../../utils';

var failureHandler = utils.failureHandler({
    redirectTo: "study",
    redirectMsg: "Study not found.",
    transient: false
});

module.exports = function(params) {
    var self = this;
  
    self.isAdmin = root.isAdmin;

    var binder = new Binder(this)
        .obs('index', 0)
        .bind('uploadMetadataFieldDefinitions[]', [], schemaUtils.fieldDefToObs, schemaUtils.fieldObsToDef)
        .bind('version');
    
    self.save = function(vm, event) {
        utils.startHandler(vm, event);

        self.study = binder.persist(self.study);
        serverService.saveStudy(self.study, self.isAdmin())
            .then(fn.handleObsUpdate(self.versionObs, 'version'))
            .then(utils.successHandler(vm, event, "Upload metadata fields have been saved."))
            .catch(utils.failureHandler());
    };
    self.addBelow = function(field, event) {
        var index = self.uploadMetadataFieldDefinitionsObs.indexOf(field);
        var newField = schemaUtils.makeNewField();
        self.uploadMetadataFieldDefinitionsObs.splice(index+1,0,newField);
    };
    self.addFirst = function(vm, event) {
        console.log(schemaUtils);
        var field = schemaUtils.makeNewField();
        self.uploadMetadataFieldDefinitionsObs.push(field);
    };
    
    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update())
        .catch(failureHandler);
};