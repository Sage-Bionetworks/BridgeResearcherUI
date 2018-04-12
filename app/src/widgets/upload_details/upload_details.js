import Binder from '../../binder';
import fn from '../../functions';
import jsonFormatter from '../../json_formatter';

module.exports = function(params) {
    let self = this;

    var binder = new Binder(this)
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

    fn.copyProps(self, jsonFormatter, 'prettyPrintHTML');

    params.uploadDetailsObs.subscribe(function(upload) {
        console.log(upload);
        binder.update()(upload);
        if (upload.healthData) {
            self.healthDataExistsObs(true);
            binder.update()(upload.healthData);
            if (upload.healthData.metadata) {
                self.filesObs(upload.healthData.metadata.files);
            }
        }
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
};