import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import jsonFormatter from '../../json_formatter';
import ko from 'knockout';
import utils from '../../utils';

module.exports = function(params) {
    let self = this;

    var binder = new Binder(this)
        .obs('showStudy', params.showStudy || false)
        .obs('sameStudy', false)
        .obs('studyId')
        .obs('studyName')
        .obs('filename') // upload
        .obs('status')
        .obs('healthCode')
        .obs('objectId')
        .obs('requestedOn')
        .obs('completedOn')
        .obs('completedBy')
        .obs('uploadDate')
        .obs('contentType')
        .obs('contentMd5')
        .obs('contentLength')
        .obs('validationMessageList[]')

        .obs('healthDataExists', false)
        .obs('createdOn') // healthData
        .obs('createdOnTimeZone')
        .obs('synapseExporterStatus')
        .obs('appVersion')
        .obs('phoneInfo')
        .obs('userSharingScope')
        .obs('schemaId')
        .obs('schemaRevision')
        .obs('id')
        .obs('data')
        .obs('files[]'); // special

    self.formatDateTime = function(date) {
        return (!date) ? null : fn.formatDateTime(date);
    };

    fn.copyProps(self, jsonFormatter, 'prettyPrintStringAsHTML');

    params.uploadDetailsObs.subscribe(function(upload) {
        self.filesObs([]);
        self.healthDataExistsObs(false);
        binder.update()(upload);
        if (upload.healthData) {
            self.healthDataExistsObs(true);
            binder.update()(upload.healthData);
            if (upload.healthData.metadata) {
                self.filesObs(upload.healthData.metadata.files);
            }
        }
        load();
    });
    self.linkObs = ko.computed(function() {
        return '#/participants/'+encodeURIComponent('healthCode:'+self.healthCodeObs())+'/general';
    });
    self.schemaLinkObs = ko.computed(function() {
        return '#/schemas/'+self.schemaIdObs()+'/versions/'+self.schemaRevisionObs()+'/editor';
    });
    self.schemaLabel = ko.computed(function() {
        return self.schemaIdObs() + ' v.' + self.schemaRevisionObs();
    });

    self.iconFor = function(status) {
        switch(status) {
            case 'unknown': return 'help circle icon';
            case 'validation_in_progress': return 'refresh icon';
            case 'validation_failed': return 'ui yellow text warning sign icon';
            case 'duplicate': return 'ui yellow text copy icon';
            case 'succeeded': return 'ui green text checkmark icon';
            case 'not_exported': return 'ui yellow text warning sign icon';
            default: return status;
        }    
    };

    function setSameStudy(study) {
        self.sameStudyObs(study.identifier === self.studyIdObs());
    }
    function getSession() {
        return serverService.getSession();
    }
    function getStudyList(session) {
        return serverService.getStudyList(session.environment);
    }
    function setStudyName(list) {
        var name = utils.findStudyName(list.items, self.studyIdObs());
        self.studyNameObs(name);
    }

    function load() {
        return serverService.getStudy()
            .then(setSameStudy)
            .then(getSession)
            .then(getStudyList)
            .then(setStudyName);
    }
};