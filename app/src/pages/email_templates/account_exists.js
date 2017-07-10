import ko from 'knockout';
import serverService from '../../services/server_service';
import utils from '../../utils';

module.exports = function() {
    var self = this;

    self.study = null;
    self.subjectObs = ko.observable("");
    self.editor = null;

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getStudy().then(function(study) {
            study.accountExistsTemplate = study.accountExistsTemplate || {};
            self.study = study;
            self.subjectObs(study.accountExistsTemplate.subject);
            self.editor.setData(study.accountExistsTemplate.body);
        }).catch(utils.failureHandler());
    };

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study.accountExistsTemplate.subject = self.subjectObs();
        self.study.accountExistsTemplate.body = self.editor.getData();

        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event, "Email saved."))
            .catch(utils.failureHandler());
    };
};