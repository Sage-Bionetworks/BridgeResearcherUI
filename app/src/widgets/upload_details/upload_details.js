import Binder from '../../binder';

module.exports = function(params) {
    let self = this;

    var binder = new Binder(this)
        .obs('status')
        .obs('uploadDate')
        .obs('contentLength')
        .obs('requestedOn')
        .obs('completedOn')
        .obs('completedBy')
        .obs('completedBy')
        .obs('validationMessageList[]');

    params.uploadDetailsObs.subscribe(function(upload) {
        binder.update()(upload);
    });

    self.iconFor = function(item) {
        switch(item.statusObs()) {
            case 'unknown': return 'help circle icon';
            case 'validation_in_progress': return 'refresh icon';
            case 'validation_failed': return 'ui yellow text warning sign icon';
            case 'duplicate': return 'ui yellow text copy icon';
            case 'succeeded': return 'ui green text checkmark icon';
            default: return '';
        }    
    };
};